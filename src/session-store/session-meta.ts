import { redisClient } from "../redis-client";
import { ServerSession } from "./types";
import { serialiseSessionKeys } from "./session-keys";


type SessionMeta = Omit<ServerSession, "playerIds">;


const SESSION_META_HM_FIELDS: (keyof SessionMeta)[] = [
    "clientId",
    "gameId",
    "clientDisplayName",
    "role",
    "sockets"
];


type UpdateSessionMetaParams =
    Pick<SessionMeta, "gameId" | "clientId"> &
    Partial<SessionMeta>;


async function updateSessionMeta(params: UpdateSessionMetaParams) {
    const { clientId, gameId } = params;

    const { sessionMetaKey } = serialiseSessionKeys({ clientId, gameId });

    const hSetArgs = SESSION_META_HM_FIELDS.reduce(
        (accum: string[], field) => {
            const value = params[field];

            if (typeof value === "undefined") {
                return accum;
            }

            if (typeof value === "string") {
                return accum.concat(field, value);
            }

            return accum.concat(field, value.join(","));
        },
        []
    );

    await redisClient
        .MULTI()
        .HSET(sessionMetaKey, hSetArgs)
        .PERSIST(sessionMetaKey)
        .EXEC();
}


export { updateSessionMeta, SESSION_META_HM_FIELDS };
