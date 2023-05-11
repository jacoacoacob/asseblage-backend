import * as sessionStore from "../session-store";
import { createDisconnectHandler } from "./on-disconnect";
import type { IOServer, IOServerSocket } from "./types";

function makeConnectionHandler(io: IOServer) {
    return async (socket: IOServerSocket) => {
        const { clientId, gameId } = socket.data.session!;

        // join game room
        socket.join(`game:${gameId}`);
    
        // fetch game state from database
        const gameState = {};
    
        // find all game players
        const clients = await sessionStore.listConnectedClientsForGame(gameId);

        socket.emit("session", socket.data.session!);
        
        // io.to(`game:${gameId}`).emit("users", clients);
    
        socket.on("disconnect", createDisconnectHandler(io, socket));
    }
}

// async function onConnection(io: IOServer, socket: IOServerSocket) {
//     const { clientId, gameId } = socket.data.session!;

//     // join game room
//     socket.join(`game:${gameId}`);

//     // fetch game state from database
//     const gameState = {};

//     // find all game players
//     const clients = await sessionStore.listConnectedClientsForGame(gameId);
    
//     io.to(`game:${gameId}`).emit("clients", clients);

//     socket.on("disconnect", createDisconnectHandler(io, socket));
    
// }

export { makeConnectionHandler };
