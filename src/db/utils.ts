import { DatabaseError } from "pg";

function isDatabaseError(data: unknown): data is DatabaseError {
    return typeof data === "object" && (data as any).constructor === DatabaseError;
}

function errorCodeKind(error: DatabaseError) {
    switch (error.code) {
        case "23505": return "unique_violation";
        default: return;
    }
}


export { isDatabaseError, errorCodeKind };
