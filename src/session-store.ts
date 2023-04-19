import { redisClient } from "./redis-client";
import type { RedisMultiQueuedCommand } from "@redis/client/dist/lib/multi-command";

const EXPIRE_SESSION_TTL_SECONDS = 3;

interface SessionData {
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
     * A role endows a client with a set of permissions.
     */
    role: string;
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

/**
 * convert session data stored in redis to SessionData interface complant
 * javascript object
 */
function _deserializeSessionData([clientId, gameId, role, sockets, playerIds]: string[]): SessionData {
    return {
        clientId,
        gameId,
        role,
        sockets: sockets.split(",").filter(Boolean),
        playerIds: playerIds.split(",").filter(Boolean),
    };
}


interface SessionKey {
    gameId: string;
    clientId: string;
}
/**
 * convert session key stored in redis to SessionKey object
 */
function _deserializeSessionKey(rawSessionKey: string): SessionKey {
    const [gameId, clientId] = rawSessionKey
        .slice(rawSessionKey.indexOf(":"))
        .split("__");
    
    return { gameId, clientId };
}

/**
 * convert SessionKey object into string to be used as a key in redis
 */
function _serializeSessionKey({ gameId, clientId }: SessionKey) {
    return `session:${gameId}__${clientId}`;
}

async function findSession(key: SessionKey) {
    const session: string[] | null[] = await redisClient.hmGet(
        _serializeSessionKey(key),
        ["clientId", "gameId", "role", "sockets", "playerIds"]
    );

    if (session.every((field) => typeof field === "string")) {
        return _deserializeSessionData(session);
    }

    return null;
}

async function saveSession(sessionData: SessionData) {
    const { clientId, gameId, role, playerIds, sockets } = sessionData;
    
    await redisClient
        .multi()
        .hSet(_serializeSessionKey({ gameId, clientId }), [
            "clientId",
            clientId,
            "gameId",
            gameId,
            "role",
            role,
            "sockets",
            sockets.join(","),
            "playerIds",
            playerIds.join(",")
        ])
        .persist(_serializeSessionKey({ gameId, clientId }))
        .exec();
    
    return sessionData;
}

async function listConnectedClients() {
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
            args: ["hmget", sessionID, "clientId", "gameId", "role", "sockets", "playerIds"],
        });
    });

    const results = await redisClient.multiExecutor(commands);

    return results.map(session => _deserializeSessionData(session as string[]));
}

async function listConnectedClientsForGame(gameId: string) {
    const clients = await listConnectedClients();

    return clients.filter((client) => client.gameId === gameId);
}

async function expireSession(key: SessionKey) {
    return redisClient.expire(_serializeSessionKey(key), EXPIRE_SESSION_TTL_SECONDS);
}

export { findSession, expireSession, saveSession, listConnectedClientsForGame };
export type { SessionData };
