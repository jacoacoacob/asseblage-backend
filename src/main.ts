import http from "http";

import dotenv from "dotenv";
import express from "express";
import cors from "cors";

import { createIO } from "./io-server";
import { setupIO } from "./io-events";

import { api } from "./api/routes";

dotenv.config();

const PORT = process.env.PORT || 3000;

const app = express();
const httpServer = http.createServer(app);

app.use(cors());
app.use(express.json());

app.use("/api", api);

const io = createIO(httpServer);

io.engine.use(cors());

setupIO(io);

httpServer.listen(PORT, () => {
    console.log("Server listening on port:", PORT);
});