const DEFAULT_TIMEOUT_MS = 30_000;

export function fetchWithAuth(url, options = {}) {
  const token = sessionStorage.getItem("c4k_token");
  const headers = { ...options.headers };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const signal = options.signal ?? AbortSignal.timeout(DEFAULT_TIMEOUT_MS);
  return fetch(url, { ...options, headers, signal });
}

export async function apiCall(url, options = {}) {
  const res = await fetchWithAuth(url, options);

  if (res.status === 401 || res.status === 403) {
    sessionStorage.removeItem("c4k_token");
    sessionStorage.removeItem("c4k_role");
    window.location.href = "/login";
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
