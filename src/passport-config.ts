// import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as JWTStrategy, ExtractJwt } from "passport-jwt";
import type { DeserializeUserFunction, DoneCallback } from "passport";

const jwtStrategy = () => new JWTStrategy(
    {
        secretOrKey: process.env.JWT_SECRET,
        jwtFromRequest: ExtractJwt.fromUrlQueryParameter("token"),
    },
    (payload, done) => {
        console.log(payload)
        done(null, payload);
    }
);


const userDeserializer: DeserializeUserFunction = (userId, done) => {

};

const userSerializer = (user: Express.User, done: DoneCallback) => {
    
};

export { jwtStrategy, userDeserializer, userSerializer };
