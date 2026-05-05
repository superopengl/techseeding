const COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

export function setAuthCookies(reply, { token, role }) {
  const isProd = process.env.NODE_ENV === "production";
  const baseAttrs = `Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${isProd ? "; Secure" : ""}`;
  reply.header("Set-Cookie", [
    `kpai_token=${encodeURIComponent(token)}; HttpOnly; ${baseAttrs}`,
    `kpai_role=${encodeURIComponent(role)}; ${baseAttrs}`,
  ]);
}
