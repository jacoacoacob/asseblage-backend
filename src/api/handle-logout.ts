import type { Request, Response } from "express";

async function handleLogout(req: Request, res: Response) {
    req.logout(() => {});
    res.cookie("connect.sid", "", {
        expires: new Date(),
        sameSite: true,
    });
    req.session.destroy(() => {});
    res.sendStatus(200);
}

export { handleLogout };
