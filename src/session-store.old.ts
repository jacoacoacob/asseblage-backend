import { redisClient } from "./redis-client";
import type { RedisMultiQueuedCommand } from "@redis/client/dist/lib/multi-command";

const EXPIRE_SESSION_TTL_SECONDS = 3;

interface ServerSession {
    /**
     * The unique identifier used to associate various database objects
     * related to a given game.
     */
    gameId: string;
    /**
     * The unique identifier for a client (a specific browser instance on a 
     * specific device).
     */
    clientId: string;
    /**
     * A human readable name for use in UI
     */
    clientDisplayName: string;
    /**
     * A role endows a client with a set of permissions.
     */
    role: "owner" | "guest";
    /** 
     * Each connected client may represent 1 or more players in a game.
     */
    playerIds: string[];
    /**
     * One client might connect on multiple browser tabs. This field stores
     * the unique IDs of each tabs' connected socket.
     */
    sockets: string[];
}

type ClientSession = Omit<ServerSession, "sockets">;


/**
 * Convert session data stored in redis to SessionData interface complant
 * javascript object
 */
function deserializeSessionData([clientId, gameId, clientDisplayName, role, sockets, playerIds]: string[]): ServerSession {
    return {
        clientId,
        gameId,
        clientDisplayName,
        role: role as ServerSession["role"],
        sockets: sockets.split(",").filter(Boolean),
        playerIds: playerIds.split(",").filter(Boolean),
    };
}


interface SessionKeyParams {
    gameId: string;
    clientId: string;
}
/**
 * Convert session key stored in redis to SessionKey object
 */
function deserializeSessionKey(rawSessionKey: string): SessionKeyParams {
    const [gameId, clientId] = rawSessionKey
        .slice(rawSessionKey.indexOf(":") + 1)
        .split("__");

    return { gameId, clientId };
}

/**
 * convert SessionKey object into string to be used as a key in redis
 */
function serializeSessionKey({ gameId, clientId }: SessionKeyParams) {
    return {
        sessionKey: `session:${gameId}__${clientId}`,
        sessionPlayersKey: `session-players:${gameId}__${clientId}`,
    };
}

async function findSession(key: SessionKeyParams) {
    const { sessionKey } = serializeSessionKey(key);

    const session: string[] | null[] = await redisClient.hmGet(
        sessionKey,
        ["clientId", "gameId", "clientDisplayName", "role", "sockets", "playerIds"]
    );

    if (session.every((field) => typeof field === "string")) {
        return deserializeSessionData(session);
    }

    return null;
}

async function saveSession(sessionData: ServerSession) {
    const { clientId, gameId, clientDisplayName, role, playerIds, sockets } = sessionData;

    const { sessionKey } = serializeSessionKey({ gameId, clientId });

    await redisClient
        .multi()
        .hSet(sessionKey, [
            "clientId",
            clientId,
            "gameId",
            gameId,
            "clientDisplayName",
            clientDisplayName,
            "role",
            role,
            "sockets",
            sockets.join(","),
            "playerIds",
            playerIds.join(",")
        ])
        .persist(sessionKey)
        .exec();

    return sessionData;
}

type UpdateSessionData = Pick<ServerSession, "gameId" | "clientId"> & Partial<ServerSession>;

async function updateSession(sessionData: UpdateSessionData) {
    const { clientId, gameId } = sessionData;
    
    const current = await findSession({ clientId, gameId });

    if (!current) {
        throw new Error(
            `Couldn't update session. No session found with key ${serializeSessionKey({ gameId, clientId })}`
        );
    }

    return await saveSession({ ...current, ...sessionData });
}

async function listActiveSessions() {
    const clientIDs = new Set<string>();
    let cursor = 0;

    do {
        const { cursor: scanCursor, keys: scanKeys } = await redisClient.scan(cursor, {
            MATCH: "session:*",
            COUNT: 100
        });
        cursor = scanCursor;
        scanKeys.forEach((key) => {
            clientIDs.add(key);
        });
    } while (cursor !== 0);

    const commands: RedisMultiQueuedCommand[] = [];

    clientIDs.forEach(sessionID => {
        commands.push({
            args: ["hmget", sessionID, "clientId", "gameId", "clientDisplayName", "role", "sockets", "playerIds"],
        });
    });

    const results = await redisClient.multiExecutor(commands);

    return results.map(session => deserializeSessionData(session as string[]));
}

async function listActiveSessionsForGame(gameId: string) {
    const allClients = await listActiveSessions();

    return allClients.filter((client) => client.gameId === gameId);
}

async function listActiveClientSessionsForGame(gameId: string) {
    const allSessions = await listActiveSessionsForGame(gameId);

    return allSessions.map(mapClientSession);
}

function mapClientSession(session: ServerSession): ClientSession {
    const { sockets, ...clientSession } = session;
    return clientSession;
}

async function expireSession(key: SessionKeyParams) {
    const { sessionKey } = serializeSessionKey(key);
    return redisClient.expire(sessionKey, EXPIRE_SESSION_TTL_SECONDS);
}

export {
    findSession,
    expireSession,
    saveSession,
    updateSession,
    listActiveSessionsForGame,
    listActiveClientSessionsForGame,
    deserializeSessionKey,
    mapClientSession
};
export type { ServerSession, ClientSession };
