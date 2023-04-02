import { pool } from "./pool";

interface InsertUser {
    email: string;
    pw_hash: string;
    display_name: string;
}

async function insertUser({ email, pw_hash, display_name }: InsertUser) {
    
}

export { insertUser };
