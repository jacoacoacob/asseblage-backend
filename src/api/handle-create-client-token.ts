import { handler, signJwt, verifyJwt } from "../utils";

interface ReqBody {
    gameToken: string;
}

function isValidReqBody(data: unknown): data is ReqBody {
    return (
        typeof data !== undefined &&
        Object.prototype.hasOwnProperty.call(data, "gameToken")
    )
}

/**
 * Create a client auth token.
 * 
 */
const handleCreateClientToken = handler((req, res) => {
    if (!isValidReqBody(req.body)) {
        return res.sendStatus(400);
    }

    const { gameToken } = req.body;

    const {
        role,
        exp,
        kind,
        game_id
    } = verifyJwt(gameToken);

    if (kind === "link") {
        return res.json({
            clientToken: signJwt({ game_id, role, exp, kind: "auth" }),
        });
    }

    return res.sendStatus(400);
});

export { handleCreateClientToken };
