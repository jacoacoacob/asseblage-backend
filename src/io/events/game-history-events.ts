import type { TCGameHistoryEvent } from "../../db/game-history";


interface C2SEvent {
    type: string;
    data: unknown;
    playerId: string;
}

interface C2SGameHistory {
    "game_history:events": (events: C2SEvent[]) => void;
}


interface S2CPassThroughGameHistory {
    "game_history:events:append": (events: TCGameHistoryEvent[]) => void;
}

interface S2CResolvableGameHistory {
    "game_history:events": (data: TCGameHistoryEvent[]) => void;
    "game_history:updated": (data: string) => string;
}

type S2CGameHistory = S2CResolvableGameHistory | S2CPassThroughGameHistory;

export type { C2SGameHistory, S2CGameHistory, S2CResolvableGameHistory };
