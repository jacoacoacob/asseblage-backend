import type { Request, Response } from "express";

import { dbCreateGame } from "../db/game";
import { dbCreateGameLink } from "../db/game-link";
import { signJwt } from "../utils";

/**
 * Create a new game.
 * 
 * Responds with an array of GameLink objects whose `token` 
 * and `game_id` fields can be used in POST /game/token 
 * body to request a client auth token.
 */
async function handleCreateGame(req: Request, res: Response) {
    const { id: game_id } = await dbCreateGame();

    const playerLink = await dbCreateGameLink(
        game_id,
        signJwt(
            {
                game_id,
                role: "player",
                kind: "link"
            },
            {
                expiresIn: "5y"
            }
        )
    );

    const superPlayerLink = await dbCreateGameLink(
        game_id,
        signJwt(
            {
                game_id,
                role: "super_player",
                kind: "link"
            },
            {
                expiresIn: "5y"
            }
        )
    );

    res.json({ playerLink, superPlayerLink });
}

export { handleCreateGame };
