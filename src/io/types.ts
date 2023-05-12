
import type { Server, Socket } from "socket.io";
import type { ExtendedError } from "socket.io/dist/namespace";
import { ServerSession, ClientSession } from "../session-store";

type MiddlewareNext = (err?: ExtendedError) => void;

interface ClientToServerEvents {
    g_event: (options: { type: string; data: unknown; }) => void;
}

interface ServerToClientEvents {
    session: (data: ClientSession) => void;
    connected_clients: (data: ClientSession[]) => void;
}

interface ServerToServerEvents {}

interface SocketData {
    session: ServerSession;
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
    SocketData,
};
