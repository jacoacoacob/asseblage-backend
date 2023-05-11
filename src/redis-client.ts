import { createClient } from "redis";

import { deserializeSessionKey } from "./session-store";
import type { IOServer } from "./io/types";

const redisClient = createClient({
    url: process.env.REDIS_URL,
    socket: {
        reconnectStrategy: 1000,
    }
}).on("error", (error) => {
    console.log("[redisClient] error", error);
}).on("connect", () => {
    console.log("[redisClient] connect");
}).on("ready", () => {
    console.log("[redisClient] ready");
}).on("end", () => {
    console.log("[redisClient] end");
})

redisClient
    .connect()
    .catch((error) => {
        console.error("[redisClient] connect error", new Date().toJSON(), error);
    });

redisClient.configSet("notify-keyspace-events", "Ex");

const subscriber = redisClient.duplicate();

subscriber.connect().catch(console.error);

function makeSessionExpiredHandler(io: IOServer) {
    subscriber.subscribe("__keyevent@0__:expired", (key) => {
        const { gameId } = deserializeSessionKey(key);

        // io.to(`game:${gameId}`).emit("user_disconnected", )
        console.log("[redisClient]: Expired Key", key);
        // listeners.forEach((cb) => cb(key));
    });
}

export { redisClient, makeSessionExpiredHandler };
