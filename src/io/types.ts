
import type { Server, Socket } from "socket.io";
import type { ExtendedError } from "socket.io/dist/namespace";

import { ServerSession, ClientSession } from "../session-store/types";
import { TRGame } from "../db/game-meta";
import { TRGamePlayer } from "../db/game-player";
import type { TCGameHistoryEvent } from "../db/game-history";
import { TRGameLink } from "../db/game-link";

type MiddlewareNext = (err?: ExtendedError) => void;

interface AckPayload {
    success: boolean;
    message?: string;
}

type Ack<IsSender extends boolean = false> = IsSender extends true
    ? (...args: [Error | null, AckPayload]) => void
    : (...args: [AckPayload]) => void;

type EmitWithAck<Data> = (data: Data, ack: Ack<true>) => void;
type ReceiveWithAck<Data> = (data: Data, ack: Ack) => void;

interface ClientToServerEvents {
    "session:set_client_display_name": (name: string) => void;
    "session:claim_player": (data: { playerId: string }) => void;
    "session:unclaim_player": (data: { playerId: string }) => void;
    "game:start": () => void;
    "game:end": () => void;
    "game:set_display_name": (name: string) => void;
    "game:add_player": ReceiveWithAck<{ name: string, assignToSender: boolean }>;
    "game:remove_player": ReceiveWithAck<{ playerId: string }>;
    "game:update_player_name": ReceiveWithAck<{ playerId: string; name: string }>;
    "game:event": (event: TCGameHistoryEvent ) => void;
}

interface ServerToClientEvents {
    "session:client_id": (data: ClientSession["clientId"]) => void;
    "session:all": (data: ClientSession[]) => void;
    "game:meta": (data: Pick<TRGame, "display_name" | "id" | "phase">) => void;
    "game:links": (data: TRGameLink[]) => void;
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
