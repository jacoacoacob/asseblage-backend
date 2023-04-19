import { createClient } from "redis";

const redisClient = createClient({ url: process.env.REDIS_URL });

redisClient.on("error", (error) => {
    console.log("[redisClient] onError", error);
});

redisClient.connect().catch(console.error);


redisClient.configSet("notify-keyspace-events", "Ex");

const subscriber = redisClient.duplicate();

subscriber.on("error", (error) => {
    console.log("[redisClient::Subscriber] onError", error);
});

subscriber.connect().catch(console.error);

const listeners: ((message: string) => void)[] = [];

subscriber.subscribe("__keyevent@0__:expired", (key) => {
    console.log("[redisClient]: Expired Key", key);
    listeners.forEach((cb) => cb(key));
});

function onExpired(cb: (message: string) => void) {
    listeners.push(cb);   
}

function offExpired(cb: (message: string) => void) {
    const indexOfCb = listeners.indexOf(cb);
    if (indexOfCb > -1) {
        listeners.splice(indexOfCb, 1);
    }
}

export { redisClient, onExpired, offExpired };
