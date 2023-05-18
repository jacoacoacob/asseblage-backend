
import type { BroadcastOperator, Server, Socket } from "socket.io";
import type { ExtendedError } from "socket.io/dist/namespace";
import { ServerSession, ClientSession } from "../session-store";
import { TRGame } from "../db/game-meta";
import { TRGamePlayer } from "../db/game-player";
import type { TCGameHistoryEvent } from "../db/game-history";

type MiddlewareNext = (err?: ExtendedError) => void;

interface ClientToServerEvents {
    "session:set_client_display_name": (name: string) => void;
    "session:claim_player": (playerId: string) => void;
    "game:start": () => void;
    "game:end": () => void;
    "game:set_display_name": (name: string) => void;
    "game:add_player": (name: string) => void;
    "game:event": (event: TCGameHistoryEvent ) => void;
}

interface ServerToClientEvents {
    "session:client_id": (data: ClientSession["clientId"]) => void;
    "session:all": (data: ClientSession[]) => void;
    "game:meta": (data: Pick<TRGame, "display_name" | "id" | "phase">) => void;
    "game:history": (data: TCGameHistoryEvent[]) => void;
    "game:players": (data: TRGamePlayer[]) => void;
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

interface IOContext { 
    io: IOServer;
    socket: IOServerSocket;
    gameRoom: string;
}

export type {
    ClientToServerEvents,
    IOContext,
    IOServer,
    IOServerSocket,
    MiddlewareNext,
    ServerToClientEvents,
    ServerToServerEvents,
    SocketData,
};
