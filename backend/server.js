const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT'] }
});

app.use(cors());
app.use(express.json());

// ─── In-Memory Data Store ────────────────────────────────────────────────────
const devices = [];
const shipments = [];
const telemetry = [];
const alerts = [];

// ─── Seed Data ───────────────────────────────────────────────────────────────
function seedData() {
  // 3 devices
  devices.push(
    { id: 'DEV-001', name: 'TempTracker Alpha', status: 'online', battery: 92, location: { lat: 28.6139, lng: 77.2090 }, assignedShipment: 'SHP-001' },
    { id: 'DEV-002', name: 'TempTracker Beta', status: 'online', battery: 78, location: { lat: 19.0760, lng: 72.8777 }, assignedShipment: 'SHP-002' },
    { id: 'DEV-003', name: 'TempTracker Gamma', status: 'offline', battery: 45, location: { lat: 13.0827, lng: 80.2707 }, assignedShipment: null }
  );

  // 2 active shipments
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

  // 5 sample alerts
  const now = Date.now();
  alerts.push(
    { id: uuidv4(), deviceId: 'DEV-001', shipmentId: 'SHP-001', type: 'temperature', severity: 'warning', message: 'Temperature reached 8.5°C — above safe range', timestamp: new Date(now - 3600000).toISOString(), acknowledged: false },
    { id: uuidv4(), deviceId: 'DEV-001', shipmentId: 'SHP-001', type: 'temperature', severity: 'critical', message: 'Temperature spike to 11.2°C — critical breach!', timestamp: new Date(now - 1800000).toISOString(), acknowledged: false },
    { id: uuidv4(), deviceId: 'DEV-002', shipmentId: 'SHP-002', type: 'temperature', severity: 'warning', message: 'Temperature dropped to 1.5°C — below safe range', timestamp: new Date(now - 900000).toISOString(), acknowledged: true },
    { id: uuidv4(), deviceId: 'DEV-002', shipmentId: 'SHP-002', type: 'battery', severity: 'warning', message: 'Device battery at 20% — charge soon', timestamp: new Date(now - 600000).toISOString(), acknowledged: false },
    { id: uuidv4(), deviceId: 'DEV-001', shipmentId: 'SHP-001', type: 'temperature', severity: 'critical', message: 'Temperature at 10.8°C — critical threshold exceeded', timestamp: new Date(now - 300000).toISOString(), acknowledged: false }
  );

  // Seed some telemetry history
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
    io.emit('alert:new', alert);
  }
}

// ─── API Routes ──────────────────────────────────────────────────────────────

// Dashboard stats
app.get('/api/dashboard/stats', (req, res) => {
  const activeShipments = shipments.filter(s => s.status === 'in-transit').length;
  const devicesOnline = devices.filter(d => d.status === 'online').length;
  const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged).length;
  const totalBreaches = shipments.reduce((sum, s) => sum + (s.breachCount || 0), 0);

  // Compute average temp from last 10 telemetry entries
  const recentTelemetry = telemetry.slice(-10);
  const avgTemp = recentTelemetry.length > 0
    ? parseFloat((recentTelemetry.reduce((s, t) => s + t.temperature, 0) / recentTelemetry.length).toFixed(1))
    : 0;

  res.json({ activeShipments, devicesOnline, alertCount: unacknowledgedAlerts, totalBreaches, avgTemp, totalDevices: devices.length });
});

// Shipments
app.get('/api/shipments', (req, res) => {
  const enriched = shipments.map(s => {
    const lastTelem = [...telemetry].reverse().find(t => t.shipmentId === s.id);
    return { ...s, lastTemperature: lastTelem?.temperature ?? null, lastLocation: lastTelem?.location ?? null };
  });
  res.json(enriched);
});

app.post('/api/shipments', (req, res) => {
  const { productName, origin, destination, deviceId, tempRange } = req.body;
  const id = 'SHP-' + String(shipments.length + 1).padStart(3, '0');
  const shipment = {
    id,
    productName,
    origin,
    destination,
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

  io.emit('shipment:new', shipment);
  res.status(201).json(shipment);
});

app.get('/api/shipments/:id', (req, res) => {
  const shipment = shipments.find(s => s.id === req.params.id);
  if (!shipment) return res.status(404).json({ error: 'Shipment not found' });

  const shipTelemetry = telemetry.filter(t => t.shipmentId === req.params.id);
  const shipAlerts = alerts.filter(a => a.shipmentId === req.params.id);
  res.json({ ...shipment, telemetry: shipTelemetry, alerts: shipAlerts });
});

// Telemetry
app.post('/api/telemetry', (req, res) => {
  const entry = { id: uuidv4(), ...req.body, timestamp: req.body.timestamp || new Date().toISOString() };
  telemetry.push(entry);

  // Update device location & battery
  const dev = devices.find(d => d.id === entry.deviceId);
  if (dev) {
    dev.location = entry.location;
    dev.battery = entry.battery;
  }

  checkAlerts(entry);
  io.emit('telemetry:update', entry);
  res.status(201).json(entry);
});

// Alerts
app.get('/api/alerts', (req, res) => {
  res.json(alerts);
});

app.put('/api/alerts/:id', (req, res) => {
  const alert = alerts.find(a => a.id === req.params.id);
  if (!alert) return res.status(404).json({ error: 'Alert not found' });
  alert.acknowledged = true;
  io.emit('alert:updated', alert);
  res.json(alert);
});

// Devices
app.get('/api/devices', (req, res) => {
  res.json(devices);
});

// ─── Demo Mode ───────────────────────────────────────────────────────────────
let demoInterval = null;
let demoActive = false;

function startDemo() {
  if (demoInterval) return;
  demoActive = true;
  io.emit('demo:status', { active: true });

  demoInterval = setInterval(() => {
    const activeShipments = shipments.filter(s => s.status === 'in-transit' && s.deviceId);
    activeShipments.forEach(shipment => {
      const dev = devices.find(d => d.id === shipment.deviceId);
      if (!dev) return;

      // 15% chance of alert-triggering breach
      const triggerAlert = Math.random() < 0.15;
      const temperature = triggerAlert
        ? parseFloat((9 + Math.random() * 3).toFixed(1))   // 9-12°C
        : parseFloat((0 + Math.random() * 12).toFixed(1));  // 0-12°C

      // Simulate movement along route
      const latStep = (shipment.destination.lat - dev.location.lat) * 0.015 + (Math.random() - 0.5) * 0.008;
      const lngStep = (shipment.destination.lng - dev.location.lng) * 0.015 + (Math.random() - 0.5) * 0.008;

      const entry = {
        deviceId: dev.id,
        shipmentId: shipment.id,
        timestamp: new Date().toISOString(),
        temperature,
        location: {
          lat: parseFloat((dev.location.lat + latStep).toFixed(6)),
          lng: parseFloat((dev.location.lng + lngStep).toFixed(6))
        },
        battery: Math.max(10, dev.battery - Math.random() * 0.5)
      };

      const telemetryEntry = { id: uuidv4(), ...entry };
      telemetry.push(telemetryEntry);

      dev.location = entry.location;
      dev.battery = parseFloat(entry.battery.toFixed(0));

      checkAlerts(telemetryEntry);
      io.emit('telemetry:update', telemetryEntry);
    });
  }, 3000);
}

function stopDemo() {
  if (demoInterval) {
    clearInterval(demoInterval);
    demoInterval = null;
  }
  demoActive = false;
  io.emit('demo:status', { active: false });
}

app.post('/api/demo/start', (req, res) => {
  startDemo();
  res.json({ active: true });
});

app.post('/api/demo/stop', (req, res) => {
  stopDemo();
  res.json({ active: false });
});

app.get('/api/demo/status', (req, res) => {
  res.json({ active: demoActive });
});

// ─── Device Simulator ────────────────────────────────────────────────────────
function runSimulator() {
  setInterval(() => {
    const activeShipments = shipments.filter(s => s.status === 'in-transit' && s.deviceId);
    activeShipments.forEach(shipment => {
      const dev = devices.find(d => d.id === shipment.deviceId);
      if (!dev) return;

      // 20% chance of breach
      const isBreach = Math.random() < 0.2;
      const temperature = isBreach
        ? parseFloat((8.5 + Math.random() * 4).toFixed(1))
        : parseFloat((2 + Math.random() * 6).toFixed(1));

      // Random movement toward destination
      const latStep = (shipment.destination.lat - dev.location.lat) * 0.01 + (Math.random() - 0.5) * 0.005;
      const lngStep = (shipment.destination.lng - dev.location.lng) * 0.01 + (Math.random() - 0.5) * 0.005;

      const entry = {
        deviceId: dev.id,
        shipmentId: shipment.id,
        timestamp: new Date().toISOString(),
        temperature,
        location: {
          lat: parseFloat((dev.location.lat + latStep).toFixed(6)),
          lng: parseFloat((dev.location.lng + lngStep).toFixed(6))
        },
        battery: Math.max(10, dev.battery - Math.random() * 0.3)
      };

      // Directly add to store instead of HTTP call for efficiency
      const telemetryEntry = { id: uuidv4(), ...entry };
      telemetry.push(telemetryEntry);

      dev.location = entry.location;
      dev.battery = parseFloat(entry.battery.toFixed(0));

      checkAlerts(telemetryEntry);
      io.emit('telemetry:update', telemetryEntry);
    });
  }, 5000);
}

// ─── Socket.IO ───────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  socket.on('disconnect', () => console.log(`Client disconnected: ${socket.id}`));
});

// ─── Start Server ────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  seedData();
  runSimulator();
  console.log(`🧊 Cold-Chain Monitor API running on http://localhost:${PORT}`);
});
