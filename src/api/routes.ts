import { Router } from "express";

import { handleCreateGame } from "./handle-create-game";
import { handleCreateClientAuthToken } from "./handle-create-game-auth-token";

const api = Router();

api.post("/game", handleCreateGame);
api.post("/game/token", handleCreateClientAuthToken);

export { api };
