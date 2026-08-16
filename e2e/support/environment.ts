import fs from "node:fs";
import path from "node:path";

export function loadLocalEnvironment() {
  for (const file of [".env", ".env.admin.local", ".env.demo.local"]) loadFile(file);
}

function loadFile(file: string) {
  const envPath = path.resolve(process.cwd(), file);
  if (!fs.existsSync(envPath)) return;
  for (const rawLine of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] ??= value;
  }
}

export function getBuyerCredentials() {
  const email = process.env.AGROTRUST_AUDIT_EMAIL;
  const password = process.env.AGROTRUST_AUDIT_PASSWORD;
  if (!email || !password) {
    throw new Error("Buyer E2E credentials are missing. Define AGROTRUST_AUDIT_EMAIL and AGROTRUST_AUDIT_PASSWORD.");
  }
  return { email, password };
}

export function getAdminCredentials() {
  const email = process.env.AGROTRUST_ADMIN_EMAIL;
  const password = process.env.AGROTRUST_ADMIN_PASSWORD;
  if (!email || !password) throw new Error("Admin E2E credentials are missing. Define AGROTRUST_ADMIN_EMAIL and AGROTRUST_ADMIN_PASSWORD.");
  return { email, password };
}
