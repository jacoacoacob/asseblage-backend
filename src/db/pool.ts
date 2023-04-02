import { Pool } from "pg";

const pool = new Pool();

pool.on("connect", () => {
    console.log("[pool] onConnect");
});

pool.on("error", (err) => {
    console.log("[pool] onError", err);
});

export { pool };
