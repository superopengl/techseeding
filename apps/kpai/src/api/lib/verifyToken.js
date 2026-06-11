import jwt from "jsonwebtoken";
import { getAuthToken } from "./getAuthToken.js";

const JWT_SECRET = process.env.KPAI_JWT_SECRET;

export function verifyToken(request) {
  const token = getAuthToken(request);
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}
