import type { SessionKeyParams } from "./types";

const SESSION_META_KEY_PREFIX = "sess-meta";
const SESSION_PLAYERS_KEY_PREFIX = "sess-players";

/**
 * convert `SessionKeyParams` into session keys
 */
function serialiseSessionKeys({ clientId, gameId }: SessionKeyParams) {
    return {
        sessionMetaKey: `${SESSION_META_KEY_PREFIX}:${gameId}__${clientId}`,
        sessionPlayersKey: `${SESSION_PLAYERS_KEY_PREFIX}:${gameId}__${clientId}`,
    };
}

/**
 * convert string used as redis key into `SessionKeyParams`
 */
function deSerializeSessionKey(key: string): SessionKeyParams {
    const [gameId, clientId] = key
        .slice(key.indexOf(":") + 1)
        .split("__");

    return { gameId, clientId };
}

export {
    serialiseSessionKeys,
    deSerializeSessionKey,
    SESSION_PLAYERS_KEY_PREFIX,
    SESSION_META_KEY_PREFIX
};
