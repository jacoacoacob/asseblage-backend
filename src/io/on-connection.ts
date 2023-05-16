import { dbListGameHistoryEvents } from "../db/game-history";
import { dbGetGame } from "../db/game-meta";
import { dbListGamePlayers } from "../db/game-player";
import { makeSessionExpiredHandler } from "../redis-client";
import * as sessionStore from "../session-store";
import { createDisconnectHandler } from "./on-disconnect";
import type { IOServer, IOServerSocket } from "./types";

function makeConnectionHandler(io: IOServer) {

    makeSessionExpiredHandler(io);

    return async (socket: IOServerSocket) => {
        const { clientId, gameId, role } = socket.data.session!;

        // join game room
        socket.join(`game:${gameId}`);

        const gameRoom = io.to(`game:${gameId}`);

        const [gameMeta, gamePlayers, gameHistory, allSessions] = await Promise.all([
            // get game metadata
            dbGetGame(gameId),
            // find all player entities registered for this game
            dbListGamePlayers(gameId),
            // list all game events
            dbListGameHistoryEvents(gameId),
            // find all connected clients
            sessionStore.listActiveSessionsForGame(gameId),
        ]);

        if (typeof gameMeta === "undefined") {
            console.error("Couldn't find game with id:", gameId);
            return;
        }

        socket.emit("game:meta", gameMeta);
        socket.emit("game:players", gamePlayers);
        socket.emit("game:history", gameHistory);
        socket.emit("session:client_id", clientId);

        gameRoom.emit("session:all", allSessions.map(sessionStore.mapClientSession));
        
        socket.on("disconnect", createDisconnectHandler(io, socket));
    }
}

export { makeConnectionHandler };
