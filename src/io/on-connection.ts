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

    const session = await sessionStore.findSession({ clientId, gameId });

    const sockets = Array.from(
        new Set(
            session?.sockets.filter(Boolean).concat(socket.id) ?? [socket.id]
        )
    );

    // save session
    await sessionStore.saveSession({
        clientId,
        gameId,
        role,
        sockets,
        playerIds: session?.playerIds ?? [],
    });

    // join game room
    socket.join(`game:${gameId}`);

    // fetch game state from database
    const gameState = {};

    // find all game players
    const clients = await sessionStore.listConnectedClientsForGame(gameId);
    
    io.to(`game:${gameId}`).emit("clients", clients);

    socket.on("disconnect", async () => {
        const session = await sessionStore.findSession({ gameId, clientId });

        if (session) {
            console.log("[disconnect] SESSION", session)
            const indexOfSocketId = session.sockets.indexOf(socket.id);
            if (indexOfSocketId > -1) {
                const sockets = session.sockets.filter((_, i) => i !== indexOfSocketId);
                await sessionStore.saveSession({
                    ...session,
                    sockets,
                });
                if (sockets.length === 0) {
                    sessionStore.expireSession({ gameId, clientId });
                }
            }
        } else {
            sessionStore.expireSession({ gameId, clientId });
        }

        const clients = await sessionStore.listConnectedClientsForGame(gameId);

        io.to(`game:${gameId}`).emit("clients", clients);
    });
}

export { onConnection };
