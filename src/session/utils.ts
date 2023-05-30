import { redisClient } from "../redis-client";

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

export { scanKeys };
