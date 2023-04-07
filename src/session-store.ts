import { RedisMultiQueuedCommand } from "@redis/client/dist/lib/multi-command";
import { redisClient } from "./redis-client";

interface SessionData {
    gameId: string;
    clientId: string;
    role: string;
    connected: boolean;
}

const SESSION_TTL = 24 * 60 * 60;

function _deserializeRawSession([clientId, gameId, role, connected]: string[]): SessionData {
    return { clientId, gameId, role, connected: connected === "true" };
}

async function findSession(clientID: string) {
    const session = await redisClient.hmGet(
        `session:${clientID}`,
        ["clientId", "gameId", "role", "connected"]
    );
    
    return _deserializeRawSession(session);
}

type SaveSessionData = Pick<SessionData, "connected" | "gameId" | "role">;

async function saveSession(clientID: string, data: SaveSessionData) {
    const { gameId, role, connected } = data;

    const result = await redisClient
        .multi()
        .hSet(`session:${clientID}`, [
            "clientId",
            clientID,
            "gameId",
            gameId,
            "role",
            role,
            "connected",
            `${connected}`
        ])
        .expire(`session:${clientID}`, SESSION_TTL)
        .exec();
    
    return result;
}

async function listAllSessions() {
    const sessionIDs = new Set<string>();
    let cursor = 0;

    do {
        const { cursor: scanCursor, keys: scanKeys } = await redisClient.scan(cursor, {
            MATCH: "session:*",
            COUNT: 100
        });
        cursor = scanCursor;
        scanKeys.forEach(sessionIDs.add);
    } while (cursor !== 0);

    const commands: RedisMultiQueuedCommand[] = [];
    
    sessionIDs.forEach(sessionID => {
        commands.push({
            args: ["hmget", sessionID, "clientId", "gameId", "role", "connected"],
        });
    });

    const results = await redisClient.multiExecutor(commands);
    
    return results.map(session => _deserializeRawSession(session as string[]));    
}

async function filterAllSessions(cb: (session: SessionData) => boolean) {
    const sessions = await listAllSessions();

    return sessions.filter(cb);
}

export { findSession, saveSession, listAllSessions, filterAllSessions };
export type { SessionData };
