import { dbCreateGamePlayer, dbDeleteGamePlayer, dbGetGamePlayer, dbUpdateGamePlayerDisplayName } from "../db/game-player";
import { assertAuthenticated } from "../io/assert-authenticated";
import { IOContext } from "../io/types";
import {  addSessionPlayer, removeSessionPlayers, listSessions } from "../session-store";
import { resolveAndSend } from "./composed";
import { errorCodeKind, isDatabaseError } from "../db/utils";
import type { ServerSession } from "../session-store/types";

async function getCanEditOrDeletePlayer(session: ServerSession, playerId: string) {
    const { role, clientId } = session;
    
    if (role === "owner") {
        return true;
    }

    const player = await dbGetGamePlayer(playerId);

    if (!player) {
        return false;
    }

    return player.created_by === clientId;
}

function registerGameEventHandlers(context: IOContext) {
    const { socket } = context;
    
    socket.on("game:add_player", async ({ name, assignToSender }, acknowledge) => {
        const { gameId, clientId } = assertAuthenticated(socket);
        
        let player;
        try {
            player = await dbCreateGamePlayer(gameId, clientId, name);
        } catch (error) {
            if (isDatabaseError(error)) {
                const kind = errorCodeKind(error);
                if (kind === "unique_violation") {
                    return acknowledge({
                        success: false,
                        message: `Player with name ${name} already exists`
                    });
                }
                return acknowledge({
                    success: false,
                    message: error.message
                });
            }
            return acknowledge({ success: false });
        }

        if (assignToSender) {
            await addSessionPlayer({ clientId, gameId, playerId: player.id });

            resolveAndSend(context, ["to_all", "session:all"]);
        }

        resolveAndSend(context, ["to_all", "game:players"]);

        acknowledge({ success: true });
    });

    socket.on("game:update_player_name", async ({ playerId, name }, acknowledge) => {
        const session = assertAuthenticated(socket);

        const canEditOrDelete = await getCanEditOrDeletePlayer(session, playerId);
    
        if (!canEditOrDelete) {
            acknowledge({ success: false, message: "Unauthorized" });
            return;
        }

        try {
            await dbUpdateGamePlayerDisplayName(playerId, name);
        } catch (error) {
            if (isDatabaseError(error)) {
                const kind = errorCodeKind(error);
                if (kind === "unique_violation") {
                    return acknowledge({
                        success: false,
                        message: `Player with name ${name} already exists`
                    });
                }
                return acknowledge({
                    success: false,
                    message: error.message
                });
            }
            return acknowledge({ success: false });
        }

        await resolveAndSend(context, ["to_all", "game:players"]);

        acknowledge({ success: true });
    });

    socket.on("game:remove_player", async ({ playerId }, acknowledge) => {
        const session = assertAuthenticated(socket);

        const { gameId } = session;

        const canEditOrDelete = await getCanEditOrDeletePlayer(session, playerId);

        if (!canEditOrDelete) {
            acknowledge({ success: false, message: "Unauthorized" });
            return;
        }

        const sessions = await listSessions(gameId);

        await Promise.all(
            sessions.reduce((accum: Promise<void>[], session) => {
                const { clientId, gameId, playerIds } = session;

                const indexOfPlayerId = playerIds.indexOf(playerId);

                if (indexOfPlayerId > -1) {
                    session.playerIds.splice(indexOfPlayerId, 1);
    
                    accum.push(removeSessionPlayers({
                        clientId,
                        gameId,
                        playerIds: [playerId],
                    }));
                }

                return accum;
            }, [])
        );

        await dbDeleteGamePlayer(playerId);

        await resolveAndSend(context,
            ["to_all", "session:all"],
            ["to_all", "game:players"],
        );

        acknowledge({ success: true });
    });
}

export { registerGameEventHandlers };
