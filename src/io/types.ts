
import type { Server, Socket } from "socket.io";
import type { ExtendedError } from "socket.io/dist/namespace";
import { SessionData } from "../session-store";

type MiddlewareNext = (err?: ExtendedError) => void;

interface ClientToServerEvents {
    g_event: (options: { type: string; data: unknown; }) => void;
}

interface ServerToClientEvents {
    session: (data: SessionData) => void;
    // users: (data: SessionData[]) => void;
    // user_disconnected: (data: SessionData) => void;
}

interface ServerToServerEvents {}

interface SocketData {
    session: SessionData;
}

type IOServer = Server<
    ClientToServerEvents,
    ServerToClientEvents,
    ServerToServerEvents,
    SocketData
>;
    
type IOServerSocket = Socket<    
    ClientToServerEvents,
    ServerToClientEvents,
    ServerToServerEvents,
    SocketData
>;

export type {
    ClientToServerEvents,
    IOServer,
    IOServerSocket,
    MiddlewareNext,
    ServerToClientEvents,
    ServerToServerEvents,
    SocketData
};
