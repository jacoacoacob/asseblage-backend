import http from "http";

import express from "express";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import { api } from "./api/routes";
import { makeIOSessionMiddleware } from "./io/session-middleware";
import { getEnv } from "./utils";
import { onConnection } from "./io/on-connection";

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

io.on("connection", (socket) => {
    onConnection(io, socket);
});

httpServer.listen(PORT, () => {
    console.log("Server listening on port:", PORT);
});
