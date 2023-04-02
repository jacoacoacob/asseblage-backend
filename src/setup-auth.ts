import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";

import type { Express } from "express";

import { sessionMiddleware } from "./session-middleware";
import type { IOServer } from "./io-server";

const DUMMY_USER: Express.User = {
    username: "captain",
    id: "1234",
};

function setupAuth(app: Express, { io, ioAuthenticated }: IOServer) {
    passport.use(
        new LocalStrategy((username, password, done) => {
            console.log("[username & password]", username, password)
            if (username === DUMMY_USER.username && password === "yarrr") {
                console.log("[passport LocalStrategy] authentication OK");
                return done(null, DUMMY_USER);
            } else {
                console.log("[passport LocalStrategy] invalid credentials");
                return done("Invalid credentials", false);
            }
        })
    );

    passport.serializeUser((user, done) => {
        const userId = (user as any).id;
        console.log("[passport serializeUser]", userId);
        done(null, userId);
    });

    passport.deserializeUser((userId, done) => {
        console.log("[passport deserializeUser]", userId);
        done(null, DUMMY_USER);
    });

    app.use(sessionMiddleware);
    app.use(passport.initialize());
    app.use(passport.session());

    app.get("/api", (req, res) => {
        res.json({ hello: "you", user: req.user });
    })

    // app.post("/api/login", passport.authenticate("local"));

    app.post("/api/logout", (req, res) => {
        req.logout(() => void 0);
        res.cookie("connect.sid", "", {
            expires: new Date(),
            sameSite: true
        });
        req.session.destroy(() => void 0);
        res.redirect("/");
    });

    app.get("/api/ping", (req, res) => {
        console.log(req.user)
        return res.json({ yes: "pong", user: req.user })
    })

    io.engine.use(sessionMiddleware as any);
    io.engine.use(passport.initialize() as any);
    io.engine.use(passport.session());

    ioAuthenticated.use((socket, next) => {
        console.log("[ioAuthenticated auth]", socket.request.user)
        if (socket.request.isAuthenticated()) {
            next();
        } else {
            next(new Error("Unauthorized"));
        }
    });
}

export { setupAuth };