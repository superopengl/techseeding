import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.KPAI_JWT_SECRET;

export function verifyToken(request) {
  const auth = request.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return null;
  }
  try {
    return jwt.verify(auth.slice(7), JWT_SECRET);
  } catch {
    return null;
  }
}
