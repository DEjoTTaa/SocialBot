import { resolve } from "path";
import { config as dotenvConfig } from "dotenv";

dotenvConfig({ path: resolve(import.meta.dirname, "..", ".env.local") });

function env(name: string, required = true): string {
  const value = (process.env[name] ?? "").trim();
  if (required && !value) {
    throw new Error(`Variável de ambiente ${name} não definida em .env.local`);
  }
  return value;
}

export const MOCK = (process.env.MOCK ?? "").trim() === "1";

export const ANTHROPIC_API_KEY = env("ANTHROPIC_API_KEY");
export const ANTHROPIC_WORKSPACE_ID = env("ANTHROPIC_WORKSPACE_ID", false);
export const MONGODB_URI = env("MONGODB_URI");
export const META_TOKEN = env("META_TOKEN", !MOCK);
export const IG_USER_ID = env("IG_USER_ID", !MOCK);
