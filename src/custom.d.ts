import { Socket } from "socket.io";

declare module "http" {
    import { Session } from "express-session";

    interface IncomingMessage extends Express.Request {
        session: Session;
    }
}
