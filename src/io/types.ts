
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

type EmitWithAck<Data = {}> = (data: Data, ack: Ack<true>) => void;
type ReceiveWithAck<Data = {}> = (data: Data, ack: Ack) => void;

interface C2SGameHistoryEvent {
    type: string;
    data: unknown;
    playerId: string;
}

interface ClientToServerEvents {
    "session:set_client_display_name": (name: string) => void;
    "session:claim_player": (data: { playerId: string }) => void;
    "session:unclaim_player": (data: { playerId: string }) => void;
    "game_meta:start_game": ReceiveWithAck;
    "game:set_display_name": (name: string) => void;
    "game:add_player": ReceiveWithAck<{ name: string, assignToSender: boolean }>;
    "game:remove_player": ReceiveWithAck<{ playerId: string }>;
    "game:update_player_name": ReceiveWithAck<{ playerId: string; name: string }>;
    "game_history:events": ReceiveWithAck<C2SGameHistoryEvent[]>;
}

interface ResolvableServerToClientEvents {
    "session:client_id": (data: ClientSession["clientId"]) => void;
    "session:all": (data: ClientSession[]) => void;
    "game:meta": (data: Pick<TRGame, "display_name" | "id" | "phase">) => void;
    "game:links": (data: TRGameLink[]) => void;
    "game:players": (data: TRGamePlayer[]) => void;
    "game_history:events": (data: TCGameHistoryEvent[]) => void;
    "game_history:updated": (data: string) => void;
}

interface PassThroughServerToClientEvents {
    "game_history:events:append": (data: TCGameHistoryEvent[]) => void;
}

type ServerToClientEvents =
    ResolvableServerToClientEvents &
    PassThroughServerToClientEvents;


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
    ReceiveWithAck,
    PassThroughServerToClientEvents,
    ResolvableServerToClientEvents,
    ServerToClientEvents,
    ServerToServerEvents,
    SocketData,
};
