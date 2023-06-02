import type { SessionKeyParams } from "./types";

const SESSION_META_KEY_PREFIX = "sess-meta";
const SESSION_PLAYERS_KEY_PREFIX = "sess-players";


function serializeSessionKeyId({ clientId, gameId }: SessionKeyParams) {
    return `${gameId}__${clientId}`;
}


/**
 * convert string used as redis key into `SessionKeyParams`
 */
function deSerializeSessionKeyId(key: string): SessionKeyParams {
    const [gameId, clientId] = key
        .slice(key.indexOf(":") + 1)
        .split("__");

    return { gameId, clientId };
}


/**
 * convert `SessionKeyParams` into session keys
 */
function serialiseSessionKeys(params: SessionKeyParams) {
    const keyId = serializeSessionKeyId(params);
    return {
        sessionMetaKey: `${SESSION_META_KEY_PREFIX}:${keyId}`,
        sessionPlayersKey: `${SESSION_PLAYERS_KEY_PREFIX}:${keyId}`,
    };
}


export {
    deSerializeSessionKeyId,
    serializeSessionKeyId,
    serialiseSessionKeys,
    SESSION_PLAYERS_KEY_PREFIX,
    SESSION_META_KEY_PREFIX
};
