const BASE = '/api/resources';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const getResources = (params = {}) => {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v))
  ).toString();
  return request(qs ? `?${qs}` : '');
};

export const getResource    = (id)      => request(`/${id}`);
export const createResource = (body)    => request('', { method: 'POST', body: JSON.stringify(body) });
export const updateResource = (id, body) => request(`/${id}`, { method: 'PUT', body: JSON.stringify(body) });
export const deleteResource = (id)      => request(`/${id}`, { method: 'DELETE' });
