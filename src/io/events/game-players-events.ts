import type { TRGamePlayer } from "../../db/game-player";
import type { ReceiveWithAck } from "../types";


interface C2SGamePlayers {
    "game_players:add": ReceiveWithAck<{ name: string; assignToSender: boolean }>;
    "game_players:remove": ReceiveWithAck<{ playerId: string }>;
    "game_players:update_name": ReceiveWithAck<{ playerId: string; name: string }>;
}


interface S2CGamePlayersResolvable {
    "game_players:list": (data: TRGamePlayer[]) => void;
}

type S2CGamePlayers = S2CGamePlayersResolvable;

export type { C2SGamePlayers, S2CGamePlayers, S2CGamePlayersResolvable };
