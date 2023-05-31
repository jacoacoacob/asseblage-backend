interface ServerSession {
    /**
     * The unique identifier used to associate various database objects
     * related to a given game.
     */
    gameId: string;
    /**
     * The unique identifier for a client (a specific browser instance on a 
     * specific device).
     */
    clientId: string;
    /**
     * A human readable name for use in UI
     */
    clientDisplayName: string;
    /**
     * A role endows a client with a set of permissions.
     */
    role: "owner" | "guest";
    /** 
     * Each connected client may represent 1 or more players in a game.
     */
    playerIds: string[];
    /**
     * One client might connect on multiple browser tabs. This field stores
     * the unique IDs of each tabs' connected socket.
     */
    sockets: string[];
}

type ClientSession = Omit<ServerSession, "sockets">;

interface SessionKeyParams {
    clientId: string;
    gameId: string;
}

export type { ServerSession, ClientSession, SessionKeyParams };
