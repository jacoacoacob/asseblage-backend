import { Router } from "express";

import { handleCreateGame } from "./handle-create-game";
import { handleCreateClientToken } from "./handle-create-client-token";

const api = Router();

api.post("/game", handleCreateGame);
api.post("/game/client-token", handleCreateClientToken);

export { api };
