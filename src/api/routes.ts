import { Router } from "express";
import passport from "passport";

import { handleRegister } from "./handle-register";
import { handleLogout } from "./handle-logout";

const api = Router();

api.post("/login", passport.authenticate("local"));
api.post("/logout", handleLogout);
api.post("/register", handleRegister);

export { api };
