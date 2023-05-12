import { Router } from "express";

import { handleCreateGame } from "./handle-create-game";

const api = Router();

api.post("/game", handleCreateGame);

export { api };
