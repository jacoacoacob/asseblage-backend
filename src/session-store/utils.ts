import { redisClient } from "../redis-client";
import type { ServerSession } from "./types";


async function scanKeys(pattern: string) {
    const keys = new Set<string>();
    let cursor = 0;

    do {
        const { cursor: scanCursor, keys: scanKeys } = await redisClient.scan(cursor, {
            MATCH: pattern,
            COUNT: 100,
        });
        cursor = scanCursor;
        for (let i = 0; i < scanKeys.length; i++) {
            keys.add(scanKeys[i]);
        }
    } while (cursor !== 0);

    return Array.from(keys);
}


function deserializeSessionMetaData(data: string[]) {
    const [clientId, gameId, clientDisplayName, role, sockets] = data;
    return {
        clientId,
        gameId,
        clientDisplayName,
        role: role as ServerSession["role"],
        sockets: sockets.split(",").filter(Boolean),
    };
}

export { scanKeys, deserializeSessionMetaData };
