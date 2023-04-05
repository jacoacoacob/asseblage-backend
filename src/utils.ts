import * as crypto from "crypto";
import * as jwt from "jsonwebtoken";
import type { RequestHandler } from "express";

type EnvVariable = "ALLOWED_ORIGINS" | "JWT_SECRET";

function getEnv(variable: EnvVariable, defaultValue = "") {
    return process.env[variable] ?? defaultValue;
}

interface Payload {
    game_id: string;
    kind: "link" | "auth";
    role: "player" | "super_player";
    iat: number;
    exp: number;
    jti: string;
}

type CreatePayload = Partial<Payload> & Pick<Payload, "game_id" | "role" | "kind">;

function signJwt(payload: CreatePayload, options?: jwt.SignOptions) {
    return jwt.sign(
        {
            jti: crypto.randomUUID(),
            ...payload
        },
        getEnv("JWT_SECRET"),
        options
    );
}

function verifyJwt(token: string, options?: jwt.VerifyOptions) {
    return jwt.verify(
        token,
        getEnv("JWT_SECRET"),
        options
    ) as Payload;
}

function handler(callback: RequestHandler) {
    const wrapper: RequestHandler = (req, res, next) => {
        try {
            return callback(req, res, next);
        } catch (error) {
            return res.sendStatus(500);
        }
    }
    return wrapper;
}

export { getEnv, signJwt, verifyJwt, handler };
export type { Payload };
