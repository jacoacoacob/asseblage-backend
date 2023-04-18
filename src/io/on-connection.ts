import * as sessionStore from "../session-store";
import type { IOServer, IOServerSocket, SocketData } from "./types";

async function onConnection(io: IOServer, socket: IOServerSocket) {
    const {
        session: {
            gameId,
            clientId,
            role
        }
    } = socket.data as SocketData;
    
    // save session
    await sessionStore.saveSession(clientId, {
        gameId,
        role,
        playerIds: [],
    });

    // join game room
    socket.join(`game:${gameId}`);

    // fetch game state from database
    const gameState = {};

    // find all game players
    const clients = await sessionStore.listConnectedClientsForGame(gameId);
    
    io.to(`game:${gameId}`).emit("clients", clients);

    socket.on("disconnect", async () => {
        sessionStore.expireSession({ gameId, clientId });

        const clients = await sessionStore.listConnectedClientsForGame(gameId);

        io.to(`game:${gameId}`).emit("clients", clients);
    });
}

export { onConnection };
