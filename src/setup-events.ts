import { Server, Socket } from "socket.io";


function onConnection(socket: Socket) {
    
}

function setupSockets(io: Server) {
    io.on("connection", onConnection);
}

export { setupSockets };
