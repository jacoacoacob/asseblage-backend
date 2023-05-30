import type { Request, Response } from "express";

import { dbCreateGame } from "../db/game-meta";
import { dbCreateGameLink } from "../db/game-link";
import { dbCreateGameHistory } from "../db/game-history";

/**
 * Create a new game.
 * 
 * Responds with an array of GameLink objects whose `token` 
 * and `game_id` fields can be used in POST /game/token 
 * body to request a client auth token.
 */
async function handleCreateGame(req: Request, res: Response) {
    const { id: gameId } = await dbCreateGame();

    const [ownerLink, guestLink, _] = await Promise.all([
        dbCreateGameLink(gameId, "owner"),
        dbCreateGameLink(gameId, "guest"),
        dbCreateGameHistory(gameId),
    ]);

    res.json({ ownerLink, guestLink });
}

export { handleCreateGame };
