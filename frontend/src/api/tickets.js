const BASE = '/api/tickets';
async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, { headers: { 'Content-Type': 'application/json' }, ...opts });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}
export const getTickets    = (epic_id)     => req(epic_id ? `?epic_id=${epic_id}` : '');
export const createTicket  = (body)        => req('', { method: 'POST', body: JSON.stringify(body) });
export const updateTicket  = (id, body)    => req(`/${id}`, { method: 'PUT', body: JSON.stringify(body) });
export const deleteTicket  = (id)          => req(`/${id}`, { method: 'DELETE' });
