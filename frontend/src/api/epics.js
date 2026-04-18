const BASE = '/api/epics';
async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, { headers: { 'Content-Type': 'application/json' }, ...opts });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}
export const getEpics   = (params = {}) => {
  const qs = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([,v]) => v))).toString();
  return req(qs ? `?${qs}` : '');
};
export const getEpic    = (id)       => req(`/${id}`);
export const createEpic = (body)     => req('', { method: 'POST', body: JSON.stringify(body) });
export const updateEpic = (id, body) => req(`/${id}`, { method: 'PUT', body: JSON.stringify(body) });
export const deleteEpic = (id)       => req(`/${id}`, { method: 'DELETE' });
