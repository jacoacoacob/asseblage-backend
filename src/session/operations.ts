import type { RedisMultiQueuedCommand } from "@redis/client/dist/lib/multi-command";

import { redisClient } from "../redis-client";
import { serialiseSessionKeys, SESSION_META_KEY_PREFIX, SESSION_PLAYERS_KEY_PREFIX } from "./session-keys";
import type { ServerSession, ClientSession, SessionKeyParams } from "./types";
import { WatchError } from "redis";
import { scanKeys } from "./utils";

type Command = RedisMultiQueuedCommand;

const EXPIRE_SESSION_TTL_SECONDS = 3;


function _deserializeSessionMetaData(data: string[]) {
    const [clientId, gameId, clientDisplayName, role, sockets] = data;
    return {
        clientId,
        gameId,
        clientDisplayName,
        role,
        sockets: sockets.split(",").filter(Boolean),
    };
}


async function listGameSessions(gameId: string) {
    const [metaKeys, playerKeys] = await Promise.all([
        scanKeys(SESSION_META_KEY_PREFIX + ":" + gameId + "*"),
        scanKeys(SESSION_PLAYERS_KEY_PREFIX + ":" + gameId + "*"),
    ]);

    const getSessionMeta: Command[] = metaKeys.map(
        (key) => ({
            args: [
                "hmget",
                key,
                "clientId",
                "gameId",
                "clientDisplayName",
                "role",
                "sockets"
            ],
        })
    );

    const getSessionPlayers: Command[] = playerKeys.map(
        (key) => ({ args: ["smembers", key] })
    );

    const [rawSessionMeta, sessionPlayers] = await Promise.all([
        redisClient.multiExecutor(getSessionMeta),
        redisClient.multiExecutor(getSessionPlayers),
    ]);
    
    const sessionMeta = rawSessionMeta.map(
        (data) => _deserializeSessionMetaData(data as string[])
    );


    return [];
}


async function findSession(params: SessionKeyParams) {
    const { sessionMetaKey, sessionPlayersKey } = serialiseSessionKeys(params);


}


async function saveSessionMeta() {

}




async function expireSession({ clientId, gameId }: SessionKeyParams) {
    const { sessionMetaKey, sessionPlayersKey } = serialiseSessionKeys({ clientId, gameId });

    await redisClient
        .multi()
        .expire(sessionMetaKey, EXPIRE_SESSION_TTL_SECONDS)
        .expire(sessionPlayersKey, EXPIRE_SESSION_TTL_SECONDS)
        .exec();
}


export { listGameSessions, expireSession };
