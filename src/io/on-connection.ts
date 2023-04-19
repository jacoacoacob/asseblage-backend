import * as sessionStore from "../session-store";
import { createDisconnectHandler } from "./on-disconnect";
import type { IOServer, IOServerSocket, SocketData } from "./types";

async function onConnection(io: IOServer, socket: IOServerSocket) {
    const { clientId, gameId } = socket.data.session!;

    // join game room
    socket.join(`game:${gameId}`);

    // fetch game state from database
    const gameState = {};

    // find all game players
    const clients = await sessionStore.listConnectedClientsForGame(gameId);
    
    io.to(`game:${gameId}`).emit("clients", clients);

    socket.on("disconnect", createDisconnectHandler(io, socket));

    // socket.on("disconnect", async (reason) => {
        
    //     const session = await sessionStore.findSession({ gameId, clientId });

    //     if (session) {
    //         console.log("[disconnect] SESSION", session)
    //         const indexOfSocketId = session.sockets.indexOf(socket.id);
    //         if (indexOfSocketId > -1) {
    //             const sockets = session.sockets.filter((_, i) => i !== indexOfSocketId);
    //             await sessionStore.saveSession({
    //                 ...session,
    //                 sockets,
    //             });
    //             if (sockets.length === 0) {
    //                 sessionStore.expireSession({ gameId, clientId });
    //             }
    //         }
    //     } else {
    //         sessionStore.expireSession({ gameId, clientId });
    //     }

    //     const clients = await sessionStore.listConnectedClientsForGame(gameId);

    //     io.to(`game:${gameId}`).emit("clients", clients);
    // });
}

export { onConnection };
