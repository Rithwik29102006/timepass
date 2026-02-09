const API = import.meta.env.DEV ? 'http://localhost:5001/api' : '/api';

async function fetchJSON(url, opts) {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...opts });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export const api = {
  getDashboardStats: () => fetchJSON(`${API}/dashboard/stats`),
  getShipments: () => fetchJSON(`${API}/shipments`),
  getShipment: (id) => fetchJSON(`${API}/shipments/${id}`),
  createShipment: (data) => fetchJSON(`${API}/shipments`, { method: 'POST', body: JSON.stringify(data) }),
  getAlerts: () => fetchJSON(`${API}/alerts`),
  acknowledgeAlert: (id) => fetchJSON(`${API}/alerts/${id}`, { method: 'PUT' }),
  getDevices: () => fetchJSON(`${API}/devices`),
};
