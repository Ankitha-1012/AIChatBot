const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
const FALLBACK_API_URL = API_URL.includes("localhost") ? API_URL.replace("localhost", "127.0.0.1") : null;

export async function api(path, { token, method = "GET", body } = {}) {
  const requestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  };

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, requestInit);
  } catch (e) {
    if (!FALLBACK_API_URL) throw e;
    res = await fetch(`${FALLBACK_API_URL}${path}`, requestInit);
  }

  const contentType = res.headers.get("content-type") || "";
  let data;
  try {
    if (contentType.includes("application/json")) data = await res.json();
    else data = { message: await res.text() };
  } catch (e) {
    // If server returned HTML or a non-JSON payload unexpectedly
    data = { message: `Unexpected response from server (HTTP ${res.status}).` };
  }

  if (!res.ok) {
    const msg = data?.message ? String(data.message) : `Request failed (HTTP ${res.status})`;
    throw new Error(msg.length > 260 ? msg.slice(0, 260) + "..." : msg);
  }
  return data;
}
