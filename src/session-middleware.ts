import session from "express-session";
import RedisStore from "connect-redis";

import { redisClient } from "./redis-client";

const sessionMiddleware = session({
    store: new RedisStore({ client: redisClient }),
    secret: "fakesecret",
    saveUninitialized: false,
    resave: false,
    cookie: {
        sameSite: true,
    }
});

export { sessionMiddleware };
