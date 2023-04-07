import { Router } from "express";

import { handleCreateGame } from "./handle-create-game";
import { handleCreateSessionToken } from "./handle-create-session-token";

const api = Router();

api.post("/game", handleCreateGame);
api.post("/game/token", handleCreateSessionToken);

export { api };
