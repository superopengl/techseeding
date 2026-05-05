export function clearAuthCookies(reply) {
  const isProd = process.env.NODE_ENV === "production";
  const expired = `Path=/; Max-Age=0; SameSite=Lax${isProd ? "; Secure" : ""}`;
  reply.header("Set-Cookie", [
    `kpai_token=; HttpOnly; ${expired}`,
    `kpai_role=; ${expired}`,
  ]);
}
