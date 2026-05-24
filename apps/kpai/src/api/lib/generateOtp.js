import { randomInt } from "crypto";

// Six-digit numeric code, leading zeros preserved. `randomInt(0, 1_000_000)`
// uses the OS CSPRNG, so the entropy is fine even though the alphabet is
// small — codes only live for a few minutes.
export function generateOtp() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}
