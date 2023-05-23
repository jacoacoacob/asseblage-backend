import { dbListGameHistoryEvents } from "../db/game-history";
import { dbGetGame } from "../db/game-meta";
import { dbListGamePlayers } from "../db/game-player";
import { listActiveClientSessionsForGame } from "../session-store";
import type { IOContext, ServerToClientEvents } from "../io/types";

type ArgsType<T> = T extends (...args: infer U) => any ? U : never;

type Resolver<Event extends keyof ServerToClientEvents> = () =>
    Promise<ArgsType<ServerToClientEvents[Event]>[number]>;

type ResolverMap = {
    [EventType in keyof ServerToClientEvents]: Resolver<EventType>;
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
    };

    resolvers = {
        "game:history": async () => {
            return await dbListGameHistoryEvents(session.gameId);
        },
        "game:meta": async () => {
            const { gameId } = session;
            const gameMeta = await dbGetGame(gameId);
            if (!gameMeta) {
                throw new Error(`[resolver] game:meta - couldn't find game with id: ${gameId}`);
            }
            return gameMeta;
        },
        "game:players": async () => {
            return await dbListGamePlayers(session.gameId);
        },
        "session:all": async () => {
            return await listActiveClientSessionsForGame(session.gameId);
        },
        "session:client_id": async () => {
            return session.clientId;
        },
    };

    const h = resolvers["game:history"]();
    
    h.then(d => d);
}

async function resolve< 
    Entity extends keyof ServerToClientEvents,
>(
    entity: Entity
) {
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
    ...entityList: [Destination, keyof ServerToClientEvents][]
) {
    if (typeof resolvers === "undefined") {
        console.warn("[resolveAndSend] Resolvers not registered!");
        return;
    }

    const { socket, io, gameRoom } = context;
    
    const resolved = await Promise.all(
        entityList.map(async ([dest, entity]) => ({
            dest,
            entity,
            data: await resolve(entity)
        }))
    );

    resolved.forEach(({ dest, entity, data }) => {
        if (dest === "to_sender") {
            socket.emit(entity, data as any);
        }
        if (dest === "to_all") {
            io.in(gameRoom).emit(entity, data as any);
        }
        if (dest === "to_all_except_sender") {
            socket.to(gameRoom).emit(entity, data as any);
        }
    });
}

export { resolve, resolveAndSend, registerResolvers };
