import { redisClient } from "../redis-client";
import { serialiseSessionKeys, SESSION_META_KEY_PREFIX, SESSION_PLAYERS_KEY_PREFIX } from "./session-keys";
import type { ServerSession, SessionKeyParams } from "./types";
import { scanKeys, deserializeSessionMetaData } from "./utils";
import { SESSION_META_HM_FIELDS } from "./session-meta";


const EXPIRE_SESSION_TTL_SECONDS = 5;


async function listSessions(gameId: string) {
    const [metaKeys, playerKeys] = await Promise.all([
        scanKeys(SESSION_META_KEY_PREFIX + ":" + gameId + "*"),
        scanKeys(SESSION_PLAYERS_KEY_PREFIX + ":" + gameId + "*"),
    ]);

    const [rawMetaData, rawPlayersData] = await Promise.all([
       redisClient.multiExecutor(
            metaKeys.map((metaKey) => ({
                args: [
                    "HMGET",
                    metaKey,
                    ...SESSION_META_HM_FIELDS
                ]
            }))
        ),
        redisClient.multiExecutor(
            playerKeys.map((playerKey) => ({
                args: [
                    "HKEYS",
                    playerKey
                ],
            }))
        ),
    ]);

    // Use object to map results together. Don't assume values
    // at a given index in two different result arrays correspond 
    // to the same session

    const sessions: Record<string, ServerSession> = {};

    for (let i = 0; i < metaKeys.length; i++) {
        const [_, universalKey] = metaKeys[i].split(":");
        sessions[universalKey] = {
            playerIds: [],
            ...deserializeSessionMetaData(rawMetaData[i] as string[]),
        };
    }

    for (let i = 0; i < playerKeys.length; i++) {
        const [_, universalKey] = playerKeys[i].split(":");
        sessions[universalKey].playerIds = rawPlayersData[i] as string[];
    }
    
    return Object.values(sessions);
}


async function getSession(params: SessionKeyParams): Promise<ServerSession | undefined> {
    const { sessionMetaKey, sessionPlayersKey } = serialiseSessionKeys(params);

    const [rMetaData, rPlayerIds] = await Promise.all([
        redisClient.HMGET(sessionMetaKey, SESSION_META_HM_FIELDS),
        redisClient.HKEYS(sessionPlayersKey),
    ]);

    if (rMetaData.filter(Boolean).length === 0) {
        return;
    }

    return {
        ...deserializeSessionMetaData(rMetaData),
        playerIds: rPlayerIds,
    };
}


async function persistSession(params: SessionKeyParams) {
    const { sessionMetaKey, sessionPlayersKey } = serialiseSessionKeys(params);

    await redisClient
        .MULTI()
        .PERSIST(sessionMetaKey)
        .PERSIST(sessionPlayersKey)
        .EXEC();
}


async function expireSession({ clientId, gameId }: SessionKeyParams) {
    const { sessionMetaKey, sessionPlayersKey } = serialiseSessionKeys({ clientId, gameId });

    await redisClient
        .MULTI()
        .EXPIRE(sessionMetaKey, EXPIRE_SESSION_TTL_SECONDS)
        .EXPIRE(sessionPlayersKey, EXPIRE_SESSION_TTL_SECONDS)
        .EXEC();
}


export { listSessions, getSession, expireSession, persistSession };
