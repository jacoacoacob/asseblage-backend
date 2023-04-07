import { handler, signJwt, verifyJwt } from "../utils";

interface ReqBody {
    token: string;
}

function isValidReqBody(data: unknown): data is ReqBody {
    return (
        typeof data !== undefined &&
        Object.prototype.hasOwnProperty.call(data, "token")
    )
}

/**
 * Create a client auth token.
 * 
 */
const handleCreateSessionToken = handler((req, res) => {
    if (!isValidReqBody(req.body)) {
        return res.sendStatus(400);
    }

    const { token } = req.body;

    const {
        role,
        exp,
        kind,
        game_id
    } = verifyJwt(token);

    if (kind === "link") {
        return res.json({
            token: signJwt({ game_id, role, exp, kind: "auth" })
        });
    }

    return res.sendStatus(400);
});

export { handleCreateSessionToken };
