const { v4: uuidv4 } = require('uuid');

// ─── In-Memory Data Store (resets on each cold start) ────────────────────────
const devices = [];
const shipments = [];
const telemetry = [];
const alerts = [];
let seeded = false;

function seedData() {
  if (seeded) return;
  seeded = true;

  devices.push(
    { id: 'DEV-001', name: 'TempTracker Alpha', status: 'online', battery: 92, location: { lat: 28.6139, lng: 77.2090 }, assignedShipment: 'SHP-001' },
    { id: 'DEV-002', name: 'TempTracker Beta', status: 'online', battery: 78, location: { lat: 19.0760, lng: 72.8777 }, assignedShipment: 'SHP-002' },
    { id: 'DEV-003', name: 'TempTracker Gamma', status: 'offline', battery: 45, location: { lat: 13.0827, lng: 80.2707 }, assignedShipment: null }
  );

  shipments.push(
    {
      id: 'SHP-001',
      productName: 'COVID-19 Vaccine (Pfizer)',
      origin: { address: 'Delhi Pharma Warehouse', lat: 28.6139, lng: 77.2090 },
      destination: { address: 'Mumbai Central Hospital', lat: 19.0760, lng: 72.8777 },
      deviceId: 'DEV-001',
      tempRange: { min: 2, max: 8 },
      status: 'in-transit',
      startTime: new Date(Date.now() - 3600000 * 5).toISOString(),
      breachCount: 2
    },
    {
      id: 'SHP-002',
      productName: 'Insulin (Lantus)',
      origin: { address: 'Mumbai Medical Supplies', lat: 19.0760, lng: 72.8777 },
      destination: { address: 'Chennai General Hospital', lat: 13.0827, lng: 80.2707 },
      deviceId: 'DEV-002',
      tempRange: { min: 2, max: 8 },
      status: 'in-transit',
      startTime: new Date(Date.now() - 3600000 * 2).toISOString(),
      breachCount: 1
    }
  );

  const now = Date.now();
  alerts.push(
    { id: uuidv4(), deviceId: 'DEV-001', shipmentId: 'SHP-001', type: 'temperature', severity: 'warning', message: 'Temperature reached 8.5°C — above safe range', timestamp: new Date(now - 3600000).toISOString(), acknowledged: false },
    { id: uuidv4(), deviceId: 'DEV-001', shipmentId: 'SHP-001', type: 'temperature', severity: 'critical', message: 'Temperature spike to 11.2°C — critical breach!', timestamp: new Date(now - 1800000).toISOString(), acknowledged: false },
    { id: uuidv4(), deviceId: 'DEV-002', shipmentId: 'SHP-002', type: 'temperature', severity: 'warning', message: 'Temperature dropped to 1.5°C — below safe range', timestamp: new Date(now - 900000).toISOString(), acknowledged: true },
    { id: uuidv4(), deviceId: 'DEV-002', shipmentId: 'SHP-002', type: 'battery', severity: 'warning', message: 'Device battery at 20% — charge soon', timestamp: new Date(now - 600000).toISOString(), acknowledged: false },
    { id: uuidv4(), deviceId: 'DEV-001', shipmentId: 'SHP-001', type: 'temperature', severity: 'critical', message: 'Temperature at 10.8°C — critical threshold exceeded', timestamp: new Date(now - 300000).toISOString(), acknowledged: false }
  );

  for (let i = 30; i >= 1; i--) {
    const ts = new Date(now - i * 60000 * 5);
    const temp1 = parseFloat((4 + Math.random() * 4).toFixed(1));
    const temp2 = parseFloat((3 + Math.random() * 3).toFixed(1));
    telemetry.push(
      { id: uuidv4(), deviceId: 'DEV-001', shipmentId: 'SHP-001', timestamp: ts.toISOString(), temperature: temp1, location: { lat: 28.6139 - i * 0.03, lng: 77.2090 - i * 0.015 }, battery: Math.max(70, 92 - i) },
      { id: uuidv4(), deviceId: 'DEV-002', shipmentId: 'SHP-002', timestamp: ts.toISOString(), temperature: temp2, location: { lat: 19.0760 - i * 0.02, lng: 72.8777 + i * 0.025 }, battery: Math.max(55, 78 - i) }
    );
  }
}

// ─── Alert Engine ────────────────────────────────────────────────────────────
function checkAlerts(telemetryEntry) {
  const shipment = shipments.find(s => s.id === telemetryEntry.shipmentId);
  if (!shipment) return;

  const temp = telemetryEntry.temperature;
  let alert = null;

  if (temp > 10 || temp < 0) {
    alert = {
      id: uuidv4(),
      deviceId: telemetryEntry.deviceId,
      shipmentId: telemetryEntry.shipmentId,
      type: 'temperature',
      severity: 'critical',
      message: temp > 10
        ? `CRITICAL: Temperature at ${temp}°C — exceeds 10°C limit`
        : `CRITICAL: Temperature at ${temp}°C — below 0°C limit`,
      timestamp: telemetryEntry.timestamp,
      acknowledged: false
    };
    shipment.breachCount = (shipment.breachCount || 0) + 1;
  } else if (temp > 8 || temp < 2) {
    alert = {
      id: uuidv4(),
      deviceId: telemetryEntry.deviceId,
      shipmentId: telemetryEntry.shipmentId,
      type: 'temperature',
      severity: 'warning',
      message: temp > 8
        ? `WARNING: Temperature at ${temp}°C — above safe range (2-8°C)`
        : `WARNING: Temperature at ${temp}°C — below safe range (2-8°C)`,
      timestamp: telemetryEntry.timestamp,
      acknowledged: false
    };
  }

  if (alert) {
    alerts.unshift(alert);
  }
}

// ─── Route Handler ───────────────────────────────────────────────────────────
module.exports = (req, res) => {
  seedData();

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Parse the path: /api/[...path]
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname.replace(/^\/api/, '');

  // ── Dashboard Stats ──
  if (path === '/dashboard/stats' && req.method === 'GET') {
    const activeShipments = shipments.filter(s => s.status === 'in-transit').length;
    const devicesOnline = devices.filter(d => d.status === 'online').length;
    const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged).length;
    const totalBreaches = shipments.reduce((sum, s) => sum + (s.breachCount || 0), 0);
    const recentTelemetry = telemetry.slice(-10);
    const avgTemp = recentTelemetry.length > 0
      ? parseFloat((recentTelemetry.reduce((s, t) => s + t.temperature, 0) / recentTelemetry.length).toFixed(1))
      : 0;
    return res.json({ activeShipments, devicesOnline, alertCount: unacknowledgedAlerts, totalBreaches, avgTemp, totalDevices: devices.length });
  }

  // ── Shipments ──
  if (path === '/shipments' && req.method === 'GET') {
    const enriched = shipments.map(s => {
      const lastTelem = [...telemetry].reverse().find(t => t.shipmentId === s.id);
      return { ...s, lastTemperature: lastTelem?.temperature ?? null, lastLocation: lastTelem?.location ?? null };
    });
    return res.json(enriched);
  }

  if (path === '/shipments' && req.method === 'POST') {
    const { productName, origin, destination, deviceId, tempRange } = req.body;
    const id = 'SHP-' + String(shipments.length + 1).padStart(3, '0');
    const shipment = {
      id, productName, origin, destination,
      deviceId: deviceId || null,
      tempRange: tempRange || { min: 2, max: 8 },
      status: 'in-transit',
      startTime: new Date().toISOString(),
      breachCount: 0
    };
    shipments.push(shipment);
    if (deviceId) {
      const dev = devices.find(d => d.id === deviceId);
      if (dev) dev.assignedShipment = id;
    }
    return res.status(201).json(shipment);
  }

  // ── Shipment by ID ──
  const shipmentMatch = path.match(/^\/shipments\/(.+)$/);
  if (shipmentMatch && req.method === 'GET') {
    const shipment = shipments.find(s => s.id === shipmentMatch[1]);
    if (!shipment) return res.status(404).json({ error: 'Shipment not found' });
    const shipTelemetry = telemetry.filter(t => t.shipmentId === shipmentMatch[1]);
    const shipAlerts = alerts.filter(a => a.shipmentId === shipmentMatch[1]);
    return res.json({ ...shipment, telemetry: shipTelemetry, alerts: shipAlerts });
  }

  // ── Telemetry ──
  if (path === '/telemetry' && req.method === 'POST') {
    const entry = { id: uuidv4(), ...req.body, timestamp: req.body.timestamp || new Date().toISOString() };
    telemetry.push(entry);
    const dev = devices.find(d => d.id === entry.deviceId);
    if (dev) {
      dev.location = entry.location;
      dev.battery = entry.battery;
    }
    checkAlerts(entry);
    return res.status(201).json(entry);
  }

  // ── Alerts ──
  if (path === '/alerts' && req.method === 'GET') {
    return res.json(alerts);
  }

  const alertMatch = path.match(/^\/alerts\/(.+)$/);
  if (alertMatch && req.method === 'PUT') {
    const alert = alerts.find(a => a.id === alertMatch[1]);
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    alert.acknowledged = true;
    return res.json(alert);
  }

  // ── Devices ──
  if (path === '/devices' && req.method === 'GET') {
    return res.json(devices);
  }

  // ── Demo ──
  if (path === '/demo/status' && req.method === 'GET') {
    return res.json({ active: false });
  }

  if (path === '/demo/start' && req.method === 'POST') {
    // In serverless, we can't run intervals — just simulate one batch of telemetry
    const activeShipments = shipments.filter(s => s.status === 'in-transit' && s.deviceId);
    activeShipments.forEach(shipment => {
      const dev = devices.find(d => d.id === shipment.deviceId);
      if (!dev) return;
      const temperature = parseFloat((2 + Math.random() * 8).toFixed(1));
      const latStep = (shipment.destination.lat - dev.location.lat) * 0.015 + (Math.random() - 0.5) * 0.008;
      const lngStep = (shipment.destination.lng - dev.location.lng) * 0.015 + (Math.random() - 0.5) * 0.008;
      const entry = {
        id: uuidv4(),
        deviceId: dev.id,
        shipmentId: shipment.id,
        timestamp: new Date().toISOString(),
        temperature,
        location: { lat: parseFloat((dev.location.lat + latStep).toFixed(6)), lng: parseFloat((dev.location.lng + lngStep).toFixed(6)) },
        battery: Math.max(10, dev.battery - Math.random() * 0.5)
      };
      telemetry.push(entry);
      dev.location = entry.location;
      dev.battery = parseFloat(entry.battery.toFixed(0));
      checkAlerts(entry);
    });
    return res.json({ active: true });
  }

  if (path === '/demo/stop' && req.method === 'POST') {
    return res.json({ active: false });
  }

  return res.status(404).json({ error: 'Not found' });
};
