import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.L4K_JWT_SECRET;

export function createJwtToken({ userId, role }) {
  const expiredAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return jwt.sign(
    { userId, role, expiredAt: expiredAt.toISOString() },
    JWT_SECRET,
    { expiresIn: "7d" },
  );
}
