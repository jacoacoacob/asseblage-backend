type EnvVariable = "ALLOWED_ORIGINS" | "JWT_SECRET" | "PORT";

function getEnv<T>(variable: EnvVariable, defaultValue: T) {
    return process.env[variable] ?? defaultValue;
}

export { getEnv };
