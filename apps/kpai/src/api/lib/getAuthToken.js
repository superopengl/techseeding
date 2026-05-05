export function getAuthToken(request) {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/(?:^|;\s*)kpai_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}
