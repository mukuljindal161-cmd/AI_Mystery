const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
export async function request(path, { method = 'GET', body, signal } = {}) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(abort, 60000);
  try {
    const response = await fetch(`${base}${path}`, {
      method,
      signal: controller.signal,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    const data = await response.json();
    if (!response.ok)
      throw Object.assign(
        new Error(data.error?.message || 'Something went wrong. Please try again.'),
        { status: response.status, code: data.error?.code, details: data.error?.details },
      );
    return data;
  } catch (error) {
    if (error.status) throw error;
    throw Object.assign(
      new Error(
        error.name === 'AbortError'
          ? 'The request timed out. Please try again.'
          : 'Can’t reach the server. Check your connection.',
      ),
      { code: signal?.aborted ? 'CANCELLED' : 'NETWORK_ERROR' },
    );
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}
export const api = {
  create: (body) => request('/cases', { method: 'POST', body }),
  get: (id, signal) => request(`/cases/${id}`, { signal }),
  discover: (id, clueId) =>
    request(`/cases/${id}/clues/${clueId}/discover`, { method: 'POST', body: {} }),
  hint: (id) => request(`/cases/${id}/hints`, { method: 'POST', body: {} }),
  accuse: (id, suspectId) =>
    request(`/cases/${id}/accuse`, { method: 'POST', body: { suspectId } }),
  result: (id, signal) => request(`/cases/${id}/result`, { signal }),
};
