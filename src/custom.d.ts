
declare module "http" {
    import { Session } from "express-session";

    interface IncomingMessage extends Express.Request {
        session: Session;
    }
}


declare namespace Express {
    export interface User {
        username: string;
        id: string;
    }
}

