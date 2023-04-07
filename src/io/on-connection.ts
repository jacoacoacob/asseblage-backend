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
        connected: true
    });

    // join game room
    socket.join(`game:${gameId}`);

    // fetch game state from database
    const gameState = {};

    // fetch users in game room
    const sessions = await sessionStore.filterAllSessions(
        (session) => session.gameId === gameId 
    );
    
    io.to(`game:${gameId}`).emit("players", sessions);

}

export { onConnection };
