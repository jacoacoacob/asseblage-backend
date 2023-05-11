import type { Request, Response } from "express";

import { dbCreateGame } from "../db/game";
import { dbCreateGameLink } from "../db/game-link";

/**
 * Create a new game.
 * 
 * Responds with an array of GameLink objects whose `token` 
 * and `game_id` fields can be used in POST /game/token 
 * body to request a client auth token.
 */
async function handleCreateGame(req: Request, res: Response) {
    const { id: game_id } = await dbCreateGame();

    const [ownerLink, guestLink] = await Promise.all([
        await dbCreateGameLink(game_id, "owner"),
        await dbCreateGameLink(game_id, "guest"),
    ]);

    res.json({ ownerLink, guestLink });
}

export { handleCreateGame };
