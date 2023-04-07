
import type { Server, Socket } from "socket.io";
import type { ExtendedError } from "socket.io/dist/namespace";
import { SessionData } from "../session-store";

type MiddlewareNext = (err?: ExtendedError) => void;

interface ClientToServerEvents {
    g_event: (options: { type: string; data: unknown; }) => void;
}

interface ServerToClientEvents {
    players: (data: SessionData[]) => void;
}

interface ServerToServerEvents {}

interface SocketData {
    session: {
        gameId: string;
        clientId: string;
        role: "player" | "super_player";
    }
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
