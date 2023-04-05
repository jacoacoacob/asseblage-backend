import type { Server as HTTPServer } from "http";
import { Namespace, Server } from "socket.io";

interface ClientToServerEvents {
    g_event: (options: { type: string; data: unknown; }) => void;
}

type IO = Server<
    ClientToServerEvents,
    {},
    {},
    {
        user: {
            clientId: string;
            role: "player" | "super_player"
        }
    }
>;

function createIO(httpServer: HTTPServer): IO {
    const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? "").concat(",");

    return new Server(httpServer, {
        cors: {
            origin: ALLOWED_ORIGINS,
        },
    });
}

export { createIO };
export type { IO };
