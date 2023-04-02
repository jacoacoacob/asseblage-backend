import { pool } from "./pool";

async function selectUserEmailExists(email: string) {
    const { rows } = await pool.query(`
        SELECT EXISTS (
            SELECT email FROM users WHERE email = $1
        )
    `, [email]);

    return rows[0] as boolean;
}

export { selectUserEmailExists };
