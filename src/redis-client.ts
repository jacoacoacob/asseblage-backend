import { createClient } from "redis";

import * as sessionStore from "./session-store";
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
    subscriber.subscribe("__keyevent@0__:expired", async (key) => {
        const { gameId } = sessionStore.deserializeSessionKey(key);

        const sessions = await sessionStore.listActiveSessionsForGame(gameId);

        const clients = sessions.map(sessionStore.mapClientSession);

        io.to(`game:${gameId}`).emit("connected_clients", clients);
    });
}

export { redisClient, makeSessionExpiredHandler };
