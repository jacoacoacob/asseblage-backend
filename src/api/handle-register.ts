import type { Request, Response } from "express";
import * as argon2 from "argon2";

import { pool } from "../db/pool";
import { isCredentials } from "./types";
import { selectUserEmailExists } from "../db/select-user-email-exists";

/**
 * Create a new user account
 */
async function handleRegister(req: Request, res: Response) {
    if (!isCredentials(req.body)) {
        return res.sendStatus(400);
    }
    
    const { email, password } = req.body;


    // const { rows } = await pool.query("SELECT NOW() db_now, user");

    res.send(selectUserEmailExists(email));
}

export { handleRegister };