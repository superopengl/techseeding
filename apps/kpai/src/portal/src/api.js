import { getCookie, setCookie } from "./utils/cookie";

const DEFAULT_TIMEOUT_MS = 30_000;

export function getRole() {
  return getCookie("kpai_role");
}

export function isAuthenticated() {
  return Boolean(getRole());
}

function clearRoleCookie() {
  setCookie("kpai_role", "", 0);
}

export function fetchWithAuth(url, options = {}) {
  const signal = options.signal ?? AbortSignal.timeout(DEFAULT_TIMEOUT_MS);
  return fetch(url, { ...options, credentials: "include", signal });
}

export async function apiCall(url, options = {}) {
  const res = await fetchWithAuth(url, options);

  if (res.status === 401 || res.status === 403) {
    clearRoleCookie();
    // Full reload to "/" — unmounts React tree so UserProvider re-initializes
    // empty (cookie is gone, so refresh() short-circuits to user=null).
    window.location.href = "/";
    throw new Error("Unauthorized");
  }

  const body = await res.json();

  if (!body.success) {
    const err = new Error(body.error?.message || "Request failed");
    err.code = body.error?.code || "UNKNOWN";
    err.status = res.status;
    throw err;
  }

  return body.data;
}

export async function logout() {
  try {
    await fetch("/api/logout", { method: "POST", credentials: "include" });
  } catch { /* network failure — clear locally regardless */ }
  clearRoleCookie();
}
