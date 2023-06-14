import { dbGetGameHistory, dbGetGameHistoryUpdated } from "../../db/game-history";
import { dbGetGame } from "../../db/game-meta";
import { dbListGamePlayers } from "../../db/game-player";
import { listSessions } from "../../session-store";
import type { IOContext, ResolvableServerToClientEvents, ServerToClientEvents  } from "../types";
import { dbListGameLinks } from "../../db/game-link";

type ArgsType<T> = T extends (...args: infer U) => any ? U : never;

type Resolver<Event extends keyof ResolvableServerToClientEvents> = () =>
    Promise<ArgsType<ResolvableServerToClientEvents[Event]>[number]>;

type ResolverMap = {
    [EventType in keyof ResolvableServerToClientEvents]: Resolver<EventType>;
}

let resolvers: ResolverMap;

function registerResolvers({ socket }: IOContext) {

    const session = {
        get gameId() {
            return socket.data.session?.gameId!;
        },
        get clientId() {
            return socket.data.session?.clientId!;
        },
        get role() {
            return socket.data.session?.role;
        }
    };

    resolvers = {
        "game_history:events": async () => {
            const history = await dbGetGameHistory(session.gameId);
            if (history) {
                return history.events;
            }
            return [];
        },
        "game_history:updated": async () => {
            const updated = await dbGetGameHistoryUpdated(session.gameId);
            return  updated ?? "";
        },
        "game:meta": async () => {
            const { gameId } = session;
            const gameMeta = await dbGetGame(gameId);
            if (!gameMeta) {
                throw new Error(
                    `[resolver] game:meta - couldn't find game with id: ${gameId}`
                );
            }
            return gameMeta;
        },
        "game:links": async () => {
            if (session.role === "owner") {
                return await dbListGameLinks(session.gameId);
            }
            return [];
        },
        "game:players": async () => {
            return await dbListGamePlayers(session.gameId);
        },
        "session:all": async () => {
            const sessions = await listSessions(session.gameId);
            return sessions.map(({ sockets, ...session }) => session);
        },
        "session:client_id": async () => {
            return session.clientId;
        },
    };
}

async function resolveEntity<Entity extends keyof ResolvableServerToClientEvents>(entity: Entity) {
    if (typeof resolvers === "undefined") {
        throw new Error("[resolve] Resolvers not registered!");
    }

    return await resolvers[entity]();
}

type Destination =
    "to_sender" |
    "to_all" |
    "to_all_except_sender";

async function resolveAndSend(
    context: IOContext,
    ...entityList: [Destination, keyof ResolvableServerToClientEvents][]
) {
    if (typeof resolvers === "undefined") {
        console.warn("[resolveAndSend] Resolvers not registered!");
        return;
    }
    
    const resolved = await Promise.all(
        entityList.map(async ([dest, entity]) => ({
            dest,
            entity,
            data: await resolveEntity(entity)
        }))
    );

    const send = createSender(context);

    resolved.forEach(({ dest, entity, data }) => {
        send(dest, entity, data);
    });
}

function createSender(context: IOContext) {
    return <
        Event extends keyof ServerToClientEvents,
        Data extends ArgsType<ServerToClientEvents[Event]>[number]
    >(
        dest: Destination,
        event: Event,
        data: Data
    ) => {
        const { socket, io, gameRoom } = context;
        switch (dest) {
            case "to_sender":
                return (socket as any).emit(event, data);
            case "to_all":
                return (io.in(gameRoom) as any).emit(event, data);
            case "to_all_except_sender":
                return (socket.to(gameRoom) as any).emit(event, data);
            default:
                return;
        }
    }
}

export { resolveEntity, createSender, resolveAndSend, registerResolvers };
