export function fetchWithAuth(url, options = {}) {
  const token = sessionStorage.getItem("lab67_token");
  const headers = { ...options.headers };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return fetch(url, { ...options, headers });
}

export async function apiCall(url, options = {}) {
  const res = await fetchWithAuth(url, options);
  const body = await res.json();

  if (!body.success) {
    const err = new Error(body.error?.message || "Request failed");
    err.code = body.error?.code || "UNKNOWN";
    err.status = res.status;
    throw err;
  }

  return body.data;
}
