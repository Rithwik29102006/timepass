# 🧊 ColdGuard — Cold-Chain Monitoring System

A real-time cold-chain monitoring web application for tracking vaccine and insulin transport. Features live temperature monitoring, shipment tracking on maps, and instant breach alerts.

![Tech Stack](https://img.shields.io/badge/React-18-blue) ![Node](https://img.shields.io/badge/Node.js-Express-green) ![Socket.IO](https://img.shields.io/badge/Socket.IO-realtime-yellow)

## Features

- **Real-time Dashboard** — Live stats, interactive map with color-coded shipment markers, recent alerts
- **Shipment Management** — Create, track, and monitor shipments with full telemetry history
- **Temperature Monitoring** — Circular gauge, line chart with safe-zone shading, telemetry log
- **Route Tracking** — React Leaflet maps showing shipment routes and current positions
- **Alert System** — Automatic breach detection (warning at 2–8°C bounds, critical at 0–10°C bounds)
- **Device Simulator** — Generates realistic telemetry data every 5 seconds with 20% breach probability
- **WebSocket Updates** — Real-time UI updates via Socket.IO

## Tech Stack

| Layer    | Technology                             |
| -------- | -------------------------------------- |
| Backend  | Node.js, Express, Socket.IO           |
| Frontend | React 18, Vite, Tailwind CSS          |
| Charts   | Recharts                               |
| Maps     | React Leaflet + OpenStreetMap          |
| Data     | In-memory (arrays — no database needed)|

## Quick Start

### Prerequisites

- Node.js 18+ and npm

### 1. Install & Start Backend

```bash
cd backend
npm install
npm start
```

Backend runs on **http://localhost:5001**

### 2. Install & Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on **http://localhost:5173**

### 3. Open the App

Visit **http://localhost:5173** in your browser. The device simulator auto-starts and you'll see live data flowing within seconds.

## API Endpoints

| Method | Endpoint              | Description                      |
| ------ | --------------------- | -------------------------------- |
| GET    | `/api/dashboard/stats`| Dashboard statistics             |
| GET    | `/api/shipments`      | List all shipments               |
| POST   | `/api/shipments`      | Create a new shipment            |
| GET    | `/api/shipments/:id`  | Shipment detail with telemetry   |
| POST   | `/api/telemetry`      | Submit device telemetry          |
| GET    | `/api/alerts`         | List all alerts                  |
| PUT    | `/api/alerts/:id`     | Acknowledge an alert             |
| GET    | `/api/devices`        | List all tracking devices        |

## Socket.IO Events

| Event              | Direction       | Description                  |
| ------------------ | --------------- | ---------------------------- |
| `telemetry:update` | Server → Client | New telemetry reading        |
| `alert:new`        | Server → Client | New breach alert created     |
| `alert:updated`    | Server → Client | Alert acknowledged           |
| `shipment:new`     | Server → Client | New shipment created         |

## Project Structure

```
backend/
  server.js          # Express + Socket.IO server, API routes, simulator, alert engine
  package.json

frontend/
  src/
    main.jsx         # App entry point
    App.jsx          # Router setup
    api.js           # API client
    socket.js        # Socket.IO client
    pages/
      Dashboard.jsx  # Stats, map, alerts overview
      Shipments.jsx  # Shipment list + create form
      ShipmentDetail.jsx # Gauge, chart, route map, telemetry table
      Alerts.jsx     # Alert feed with filters
    components/
      Sidebar.jsx        # Navigation sidebar
      TemperatureGauge.jsx # SVG circular gauge
      TemperatureChart.jsx # Recharts line chart
      MapView.jsx          # React Leaflet map
      AlertCard.jsx        # Alert display card
      ShipmentForm.jsx     # Create shipment modal
    hooks/
      useSocket.js   # Real-time event hooks
```
