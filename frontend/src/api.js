const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

async function request(path, options = {}, timeoutMs = 120000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  let res;
  try {
    res = await fetch(`${BASE}${path}`, { ...options, signal: ctrl.signal });
  } catch (e) {
    throw new Error(
      e.name === 'AbortError'
        ? 'The request timed out. The server may be waking up, so try again in a minute.'
        : 'Cannot reach the server. Check your connection and try again.'
    );
  } finally {
    clearTimeout(timer);
  }

  let body = null;
  try {
    body = await res.json();
  } catch {
    /* non-JSON response */
  }
  if (!res.ok || !body?.success) {
    const err = new Error(body?.error?.message || `Request failed (${res.status}).`);
    err.code = body?.error?.code;
    err.analysisId = body?.error?.analysisId;
    throw err;
  }
  return body.data;
}

export function createAnalysis({ text, file }) {
  const form = new FormData();
  if (file) form.append('file', file);
  else form.append('text', text);
  return request('/api/analyses', { method: 'POST', body: form });
}
export const listAnalyses = () => request('/api/analyses');
export const getAnalysis = (id) => request(`/api/analyses/${id}`);
