import { createClient } from "redis";

const redisClient = createClient({ url: process.env.REDIS_URL });

redisClient.connect().catch(console.error);

export { redisClient };
