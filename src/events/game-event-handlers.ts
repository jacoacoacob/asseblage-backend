import { IOContext } from "../io/types";

function registerGameEventHandlers({ socket }: IOContext) {

    socket.on("game:add_player", (playerName) => {
        
    });
}

export { registerGameEventHandlers };
