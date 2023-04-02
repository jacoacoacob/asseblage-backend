import { Server, Socket } from "socket.io";
import { IOServer } from "./io-server";

function setupEvents({ io, ioAuthenticated }: IOServer) {

    io.on("connection", (socket) => {
        console.log("[nsBase] onConnection", socket.request.sessionID);
        socket.emit("hello", socket.request.user?.username ?? "");
    });
    
    ioAuthenticated.on("connection", (socket) => {
        console.log("[nsAuthenticated] onConnection");
        socket.emit("hello", socket.request.user?.username ?? "");
    });
}

export { setupEvents };
