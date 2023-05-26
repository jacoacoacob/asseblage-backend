import { dbCreateGamePlayer, dbDeleteGamePlayer, dbUpdateGamePlayerDisplayName } from "../db/game-player";
import { assertAuthenticated } from "../io/assert-authenticated";
import { IOContext } from "../io/types";
import { findSession, updateSession, listActiveSessionsForGame, ServerSession } from "../session-store";
import { resolveAndSend } from "./composed";
import { errorCodeKind, isDatabaseError } from "../db/utils";

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
            const session = await findSession({ clientId, gameId });

            if (!session) {
                console.error("No session");
                return;
            }

            await updateSession({
                ...session,
                playerIds: [
                    ...session.playerIds,
                    player.id
                ],
            });

            resolveAndSend(context, ["to_all", "session:all"]);
        }

        resolveAndSend(context, ["to_all", "game:players"]);

        acknowledge({ success: true });
    });

    socket.on("game:update_player_name", async ({ playerId, name }, acknowledge) => {
        const { gameId, role } = assertAuthenticated(socket);

        if (role === "guest") {
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
        const { gameId, role } = assertAuthenticated(socket);

        if (role === "guest") {
            acknowledge({ success: false, message: "Unauthorized" });
            return;
        }

        const sessions = await listActiveSessionsForGame(gameId);

        await Promise.all(
            sessions.reduce((accum: Promise<ServerSession>[], session) => {
                const indexOfPlayerId = session.playerIds.indexOf(playerId);
                if (indexOfPlayerId > -1) {
                    session.playerIds.splice(indexOfPlayerId, 1);
    
                    accum.push(updateSession(session));
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
