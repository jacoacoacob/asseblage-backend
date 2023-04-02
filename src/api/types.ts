
interface Credentials {
    email: string;
    password: string;
}

function isCredentials(data: unknown): data is Credentials {
    if (
        typeof data !== "undefined" &&
        Object.prototype.hasOwnProperty.call(data, "email") &&
        Object.prototype.hasOwnProperty.call(data, "password")
    ) {
        const { email, password } = data as Credentials;
        return typeof email === "string" && typeof password === "string";
    }
    return false;
}

export { isCredentials };
export type { Credentials };
