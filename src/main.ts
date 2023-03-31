import http from "http";

import dotenv from "dotenv";
import express from "express";
import cors from "cors";

import { createIoServer } from "./io-server";
import { setupAuth } from "./setup-auth";

dotenv.config();

const PORT = process.env.PORT || 3000;

const app = express();
const httpServer = http.createServer(app);

const { io, ioAuthenticated } = createIoServer(httpServer);

app.use(cors());

setupAuth(app, { io, ioAuthenticated });

httpServer.listen(PORT, () => {
    console.log("Server listening on port:", PORT);
});