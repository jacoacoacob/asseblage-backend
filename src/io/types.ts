
import type { BroadcastOperator, Server, Socket } from "socket.io";
import type { ExtendedError } from "socket.io/dist/namespace";
import { ServerSession, ClientSession } from "../session-store";
import { TRGame } from "../db/game-meta";
import { TRGamePlayer } from "../db/game-player";
import { TRGameHistory } from "../db/game-history";

type MiddlewareNext = (err?: ExtendedError) => void;

interface ClientToServerEvents {
    "game:event": (options: { type: string; data: unknown; }) => void;
}

interface ServerToClientEvents {
    "session:client_id": (data: ClientSession["clientId"]) => void;
    "session:all": (data: ClientSession[]) => void;
    "game:meta": (data: Pick<TRGame, "display_name" | "id" | "phase">) => void;
    "game:history": (data: TRGameHistory["events"]) => void;
    "game:players": (data: TRGamePlayer[]) => void;
}

interface ServerToServerEvents {}

interface SocketData {
    session: ServerSession;
}

type IORoom = BroadcastOperator<ServerToClientEvents, SocketData>;

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
    IORoom,
    IOServer,
    IOServerSocket,
    MiddlewareNext,
    ServerToClientEvents,
    ServerToServerEvents,
    SocketData,
};
