import { scrypt, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;
const SALT_BYTES = 16;
const PRINTABLE_ASCII = /^[\x20-\x7E]+$/;

export const PASSWORD_MIN_LENGTH = 8;

export function validatePasswordStrength(password) {
  if (typeof password !== "string") return "Password is required";
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  }
  if (!PRINTABLE_ASCII.test(password)) {
    return "Password may only contain letters, numbers, and visible ASCII characters";
  }
  return null;
}

export async function hashPassword(password) {
  const salt = randomBytes(SALT_BYTES).toString("hex");
  const derived = await scryptAsync(password, salt, KEY_LENGTH);
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

export async function verifyPasswordHash(password, stored) {
  if (typeof stored !== "string") return false;
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, salt, key] = parts;
  const expected = Buffer.from(key, "hex");
  if (expected.length !== KEY_LENGTH) return false;
  const derived = await scryptAsync(password, salt, KEY_LENGTH);
  return timingSafeEqual(expected, derived);
}
