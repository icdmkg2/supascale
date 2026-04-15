import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

function keyFromSecret() {
  const secret = process.env.SESSION_SECRET || "development-only-change-me";
  return scryptSync(secret, "supascale-salt", 32);
}

export function encryptSecret(plain: string) {
  const iv = randomBytes(12);
  const key = keyFromSecret();
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decryptSecret(blob: string) {
  const buf = Buffer.from(blob, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const key = keyFromSecret();
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
