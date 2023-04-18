import * as crypto from "crypto";
import * as jwt from "jsonwebtoken";
import type { RequestHandler } from "express";

type EnvVariable = "ALLOWED_ORIGINS" | "JWT_SECRET" | "PORT";

function getEnv<T>(variable: EnvVariable, defaultValue: T) {
    return process.env[variable] ?? defaultValue;
}

interface TokenPayload {
    game_id: string;
    kind: "link" | "auth";
    role?: "player" | "super_player";
    iat: number;
    exp: number;
    jti: string;
}

type CreatePayload = Partial<TokenPayload> & Pick<TokenPayload, "game_id" | "role" | "kind">;

function signJwt(payload: CreatePayload, options?: jwt.SignOptions) {
    return jwt.sign(
        {
            jti: crypto.randomUUID(),
            ...payload
        },
        getEnv("JWT_SECRET", ""),
        options
    );
}

function verifyJwt(token: string, options?: jwt.VerifyOptions) {
    return jwt.verify(
        token,
        getEnv("JWT_SECRET", ""),
        options
    ) as TokenPayload;
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
export type { TokenPayload };
