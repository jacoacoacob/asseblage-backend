import http from "http";

import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import passport from "passport";

import { createIoServer } from "./io-server";
import { setupEvents } from "./setup-events";

import { api } from "./api/routes";

import { localStrategy, userDeserializer, userSerializer  } from "./passport-config";
import { sessionMiddleware } from "./session-middleware";

dotenv.config();

const PORT = process.env.PORT || 3000;

const app = express();
const httpServer = http.createServer(app);
const { io, ioAuthenticated } = createIoServer(httpServer);

passport.use(localStrategy);
passport.deserializeUser(userDeserializer);
passport.serializeUser(userSerializer);

app.use(cors());
app.use(express.json());
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

io.engine.use(sessionMiddleware as any);
io.engine.use(passport.initialize() as any);
io.engine.use(passport.session());

ioAuthenticated.use((socket, next) => {
    console.log("[ioAuthenticated auth]", socket.request.user)
    if (socket.request.isAuthenticated()) {
        next();
    } else {
        next(new Error("Unauthorized"));
    }
});

app.use("/api", api);

setupEvents({ io, ioAuthenticated });

httpServer.listen(PORT, () => {
    console.log("Server listening on port:", PORT);
});