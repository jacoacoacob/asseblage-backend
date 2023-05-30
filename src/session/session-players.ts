import { WatchError } from "redis";
import type { RedisMultiQueuedCommand } from "@redis/client/dist/lib/multi-command";

import { redisClient } from "../redis-client";
import { serialiseSessionKeys, SESSION_PLAYERS_KEY_PREFIX } from "./session-keys";
import type { SessionKeyParams } from "./types";
import { scanKeys } from "./utils";


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
                const gameIdPattern = SESSION_PLAYERS_KEY_PREFIX + ":" + gameId;
                
                const keys = await scanKeys(gameIdPattern);
                
                const filteredKeys = keys.filter((key) => key !== sessionPlayersKey);

                // all operations in the transation will fail if any watched keys
                // are modified during the transaction 
                await client.watch(filteredKeys);

                // // check if player is already claimed
                // const isPlayerClaimedCommands: Command[] = keys.map(
                //     (key) => ({
                //         args: ["sismember", key, playerId]
                //     })
                // );

                // const isPlayerClaimedResults = await client.multiExecutor(isPlayerClaimedCommands);

                // if (isPlayerClaimedResults.some((result) => Boolean(result))) {
                //     // playerId has already been claimed by another client
                //     return false;
                // }

                const isPlayerClaimedMulti = client.multi();

                keys.forEach((key) => {
                    isPlayerClaimedMulti.sIsMember(key, playerId);
                });

                const isPlayerClaimedResults = await isPlayerClaimedMulti.exec();

                if (isPlayerClaimedResults.some((result) => Boolean(result))) {
                    // playerId has already been claimed by another client
                    return false;
                }

                await client
                    .multi()
                    .sAdd(sessionPlayersKey, playerId)
                    .exec();

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

    
}


export { addSessionPlayer, removeSessionPlayers };
