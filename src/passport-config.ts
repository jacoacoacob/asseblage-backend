import { Strategy as LocalStrategy } from "passport-local";
import type { DeserializeUserFunction, DoneCallback } from "passport";

const localStrategy = new LocalStrategy(async (username, password, done) => {
    
});

const userDeserializer: DeserializeUserFunction = (userId, done) => {

};

const userSerializer = (user: Express.User, done: DoneCallback) => {
    
};

export { localStrategy, userDeserializer, userSerializer };
