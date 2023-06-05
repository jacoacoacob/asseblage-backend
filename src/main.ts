import http from "http";

import express from "express";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import { api } from "./api/routes";
import { getEnv } from "./utils";
import { makeConnectionHandler } from "./io/on-connection";
import { makeIOSessionMiddleware } from "./io/session-middleware";
import { pruneSessions } from "./session-pruner";

(async () => {
    const PORT = getEnv("PORT", 3000);
    const ALLOWED_ORIGINS = getEnv("ALLOWED_ORIGINS", "").split(",");
    
    const app = express();
    
    const httpServer = http.createServer(app);
    
    app.use(cors());
    app.use(express.json());
    
    app.use("/api", api);
    
    const io = new Server(httpServer, {
        cors: {
            origin: ALLOWED_ORIGINS,
        }
    });
    
    io.engine.use(cors());
    
    io.use(makeIOSessionMiddleware(io));
    
    io.on("connection", makeConnectionHandler(io));

    // if clients disconnected while the server was down,
    // invoking `pruneSessions` should expire their session
    // entries in redis
    setTimeout(() => {
        pruneSessions(io);
    }, 10000);
    
    httpServer.listen(PORT, () => {
        console.log("Server listening on port:", PORT);
    });
})();
