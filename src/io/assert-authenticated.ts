import type { ServerSession } from "../session-store";
import type { IOServerSocket } from "./types";

function assertAuthenticated(socket: IOServerSocket): ServerSession {
    const { data: { session } } = socket;

    if (!session) {
        throw new Error("unauthenticated");
    }

    return session;
}

export { assertAuthenticated };
