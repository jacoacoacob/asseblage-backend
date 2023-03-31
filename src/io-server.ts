import type { Server as HTTPServer } from "http";
import { Namespace, Server } from "socket.io";

interface ServerToClientEvents {
    noArg: () => void;
    basicEmit: (a: number, b: string, c: Buffer) => void;
    withAck: (d: string, callback: (e: number) => void) => void;
}
  
interface ClientToServerEvents {
    hello: (name: string) => void;
}

interface InterServerEvents {
    ping: () => void;
}

interface SocketData {
    name: string;
    age: number;
}

type IO = Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
>;

type IOAuthenticated = Namespace<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
>;

interface IOServer {
    io: IO;
    ioAuthenticated: IOAuthenticated;
}



function createIoServer(httpServer: HTTPServer): IOServer {
    const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? "").split(",");

    const io = new Server(httpServer, {
        cors: {
            origin: ALLOWED_ORIGINS,
        },
    });

    const ioAuthenticated = io.of("/authenticated");

    return { io, ioAuthenticated };
}

export { createIoServer };
export type { IOServer, IO, IOAuthenticated };
