import { WatchError } from "redis";

import { redisClient } from "../redis-client";
import { serialiseSessionKeys, SESSION_PLAYERS_KEY_PREFIX } from "./session-keys";
import { scanKeys } from "./utils";
import type { SessionKeyParams } from "./types";


interface AddSessionPlayersParams extends SessionKeyParams {
    playerId: string;
}


async function addSessionPlayer(params: AddSessionPlayersParams) {
    const { clientId, gameId, playerId } = params;

    const { sessionPlayersKey } = serialiseSessionKeys({ clientId, gameId });

    const MAX_RETRIES = 5;

    let retries = 0;

    async function doTheStuff(): Promise<boolean> {
        // For more on what's going on here see:
        // https://github.com/redis/node-redis/blob/master/docs/isolated-execution.md#transactions
        try {
            return await redisClient.executeIsolated(async (client) => {
                const gameIdPattern = SESSION_PLAYERS_KEY_PREFIX + ":" + gameId + "*";
                
                const keys = await scanKeys(gameIdPattern);
                
                const filteredKeys = keys.filter((key) => key !== sessionPlayersKey);

                console.log("[addSessionPlayer]", { keys, filteredKeys })

                // all operations in the transation will fail if any watched keys
                // are modified during the transaction 
                if (filteredKeys.length > 0) {
                    await client.WATCH(filteredKeys);
                }

                const isPlayerClaimedMulti = client.MULTI();

                keys.forEach((key) => {
                    // isPlayerClaimedMulti.SISMEMBER(key, playerId);
                    isPlayerClaimedMulti.HEXISTS(key, playerId);
                });

                const isPlayerClaimedResults = await isPlayerClaimedMulti.EXEC();

                if (isPlayerClaimedResults.some((result) => Boolean(result))) {
                    // playerId has already been claimed by another client
                    return false;
                }

                if (filteredKeys.length > 0) {
                    await client.WATCH(filteredKeys);
                }

                await client
                    .MULTI()
                    .HSET(sessionPlayersKey, [playerId, "1"])
                    .PERSIST(sessionPlayersKey)
                    .EXEC();

                return true;
            });
        } catch (error) {
            if (error instanceof WatchError) {
                // transaction aborted
                if (retries > MAX_RETRIES) {
                    console.warn("saveSessionPlayers maximum retries", error);
                    return false;
                }
                retries += 1;
                return await doTheStuff();
            }
            console.error(error);
            return false;
        }
    }

   return await doTheStuff();
}


interface RemoveSessionPlayersParams extends SessionKeyParams {
    playerIds: string[];
}


async function removeSessionPlayers(params: RemoveSessionPlayersParams) {
    const { clientId, gameId, playerIds } = params;

    const { sessionPlayersKey } = serialiseSessionKeys({ clientId, gameId });

    try {
        // await redisClient.SREM(sessionPlayersKey, playerIds);
        await redisClient.HDEL(sessionPlayersKey, playerIds);
    } catch (error) {
        console.error("[removeSessionPlayers]", error);   
    }
}


export { addSessionPlayer, removeSessionPlayers };
