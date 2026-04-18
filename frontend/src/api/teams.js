const BASE = '/api/teams';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const getTeams      = ()           => request('');
export const getTeam       = (id)         => request(`/${id}`);
export const createTeam    = (body)       => request('', { method: 'POST', body: JSON.stringify(body) });
export const updateTeam    = (id, body)   => request(`/${id}`, { method: 'PUT', body: JSON.stringify(body) });
export const deleteTeam    = (id)         => request(`/${id}`, { method: 'DELETE' });
export const addMember     = (id, resource_id) => request(`/${id}/members`, { method: 'POST', body: JSON.stringify({ resource_id }) });
export const removeMember  = (id, resourceId)  => request(`/${id}/members/${resourceId}`, { method: 'DELETE' });
