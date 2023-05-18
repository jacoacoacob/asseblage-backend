import { dbListGameHistoryEvents } from "../db/game-history";
import { dbGetGame } from "../db/game-meta";
import { dbListGamePlayers } from "../db/game-player";
import { listActiveClientSessionsForGame } from "../session-store";
import type { IOContext, IOServer, IOServerSocket, ServerToClientEvents } from "../io/types";

type ArgsType<T> = T extends (arg: infer U) => any ? U : never;

type Resolver<Event extends keyof ServerToClientEvents> = () =>
    Promise<ArgsType<ServerToClientEvents[Event]>>;

type ResolverMap = {
    [EventType in keyof ServerToClientEvents]: Resolver<EventType>;
}



let resolvers: ResolverMap;

function registerResolvers({ socket }: IOContext) {
    const { data: { session } } = socket;

    if (typeof session === "undefined") {
        console.warn("[registerResolvers] No session on socket!");
        return;
    }

    resolvers = {
        "game:history": async () => {
            return await dbListGameHistoryEvents(session?.gameId!);
        },
        "game:meta": async () => {
            const { gameId } = session!;
            const gameMeta = await dbGetGame(gameId!);
            if (!gameMeta) {
                throw new Error(`[resolver] game:meta - couldn't find game with id: ${gameId}`);
            }
            return gameMeta
        },
        "game:players": async () => {
            return await dbListGamePlayers(session?.gameId!);
        },
        "session:all": async () => {
            return await listActiveClientSessionsForGame(session?.gameId!);
        },
        "session:client_id": async () => {
            return session?.clientId!;
        },
    };
}

type Destination =
    "to_sender" |
    "to_all" |
    "to_all_except_sender";

async function resolveAndSend(
    context: IOContext,
    entityList: [Destination, keyof ServerToClientEvents][]
) {
    if (typeof resolvers === "undefined") {
        console.warn("[resolveAndSend] Resolvers not registered!");
        return;
    }

    const { socket, io } = context;
    
    const { data: { session } } = socket;

    if (typeof session === "undefined") {
        console.warn("No session on socket!");
        return;
    }

    const resolved = await Promise.all(
        entityList.map(async ([dest, entity]) => ({
            dest,
            entity,
            data: await resolvers[entity]()
        }))
    );

    const roomName = `game:${session.gameId}`;

    resolved.forEach(({ dest, entity, data }) => {
        if (dest === "to_sender") {
            socket.emit(entity, data as any);
        }
        if (dest === "to_all") {
            io.in(roomName).emit(entity, data as any);
        }
        if (dest === "to_all_except_sender") {
            socket.to(roomName).emit(entity, data as any);
        }
    });
}

export { resolveAndSend, registerResolvers };
