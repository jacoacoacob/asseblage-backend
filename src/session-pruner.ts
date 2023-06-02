import type { IOServer } from "./io/types";
import { SESSION_META_KEY_PREFIX, SESSION_PLAYERS_KEY_PREFIX, serializeSessionKeyId } from "./session-store/session-keys";
import { scanKeys } from "./session-store/utils";
import { expireSession } from "./session-store";

async function pruneSessions(io: IOServer) {
    const [sockets, metaKeys, playersKeys] = await Promise.all([
        io.fetchSockets(),
        scanKeys(SESSION_META_KEY_PREFIX + "*"),
        scanKeys(SESSION_PLAYERS_KEY_PREFIX + "*"),
    ])

    const socketSessionKeyIds = sockets.reduce(
        (accum: Set<string>, socket) => {
            const { data: { session } } = socket;
            if (session) {
                accum.add(serializeSessionKeyId(session));
            }
            return accum;
        },
        new Set<string>()
    );

    const redisSessionKeyIds = [...metaKeys, ...playersKeys].map(
        (key) => key.slice(key.indexOf(":") + 1)
    );

    const expireStaleSessions: Promise<void>[] = [];
    for (let i = 0; i < redisSessionKeyIds.length; i++) {
        const redisKeyId = redisSessionKeyIds[i];
        if (!socketSessionKeyIds.has(redisKeyId)) {
            const [gameId, clientId] = redisKeyId.split("__");
            expireStaleSessions.push(expireSession({ gameId, clientId }));
        }
    }

    await Promise.all(expireStaleSessions);
}

export { pruneSessions };
