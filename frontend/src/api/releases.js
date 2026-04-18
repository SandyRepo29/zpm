const BASE = '/api/releases';
async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, { headers: { 'Content-Type': 'application/json' }, ...opts });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}
export const getReleases    = ()          => req('');
export const getRelease     = (id)        => req(`/${id}`);
export const createRelease  = (body)      => req('', { method: 'POST', body: JSON.stringify(body) });
export const updateRelease  = (id, body)  => req(`/${id}`, { method: 'PUT', body: JSON.stringify(body) });
export const deleteRelease  = (id)        => req(`/${id}`, { method: 'DELETE' });
