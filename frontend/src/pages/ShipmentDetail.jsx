import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useRealtimeTelemetry, useRealtimeAlerts } from '../hooks/useSocket';
import TemperatureGauge from '../components/TemperatureGauge';
import TemperatureChart from '../components/TemperatureChart';
import MapView from '../components/MapView';
import AlertCard from '../components/AlertCard';

export default function ShipmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const latestTelemetry = useRealtimeTelemetry();
  const latestAlert = useRealtimeAlerts();

  const loadShipment = useCallback(async () => {
    try { setShipment(await api.getShipment(id)); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { loadShipment(); }, [loadShipment]);
  useEffect(() => { if (latestTelemetry?.shipmentId === id) loadShipment(); }, [latestTelemetry, id, loadShipment]);
  useEffect(() => { if (latestAlert?.shipmentId === id) loadShipment(); }, [latestAlert, id, loadShipment]);

  const handleAcknowledge = async (alertId) => {
    await api.acknowledgeAlert(alertId);
    loadShipment();
  };

  if (loading) return <DetailSkeleton />;
  if (!shipment) return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p className="text-gray-600 text-sm font-medium">Shipment not found</p>
    </div>
  );

  const telemetryData = shipment.telemetry || [];
  const lastTelem = telemetryData[telemetryData.length - 1];
  const currentTemp = lastTelem?.temperature ?? 0;
  const routePoints = telemetryData.map(t => t.location).filter(Boolean);

  const isSafe = currentTemp >= shipment.tempRange.min && currentTemp <= shipment.tempRange.max;
  const isCritical = currentTemp > 10 || currentTemp < 0;
  const statusColor = isCritical ? 'text-danger-600' : isSafe ? 'text-primary-600' : 'text-warning-600';
  const statusBg = isCritical ? 'bg-danger-50' : isSafe ? 'bg-primary-50' : 'bg-warning-50';

  const infoCards = [
    { label: 'Origin', value: shipment.origin.address, icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
    ), color: 'text-info-600', bg: 'bg-info-50' },
    { label: 'Destination', value: shipment.destination.address, icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" /></svg>
    ), color: 'text-primary-600', bg: 'bg-primary-50' },
    { label: 'Device', value: shipment.deviceId || 'Unassigned', icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" /></svg>
    ), color: 'text-gray-600', bg: 'bg-gray-100' },
    { label: 'Breaches', value: shipment.breachCount, icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
    ), color: shipment.breachCount > 0 ? 'text-danger-600' : 'text-gray-500', bg: shipment.breachCount > 0 ? 'bg-danger-50' : 'bg-gray-100' },
  ];

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/shipments')}
          className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:shadow-sm active:scale-95 transition-all">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">{shipment.id}</h1>
            <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${shipment.status === 'in-transit' ? 'bg-info-50 text-info-700' : 'bg-primary-50 text-primary-700'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${shipment.status === 'in-transit' ? 'bg-info-500 animate-pulse' : 'bg-primary-500'}`} />
              {shipment.status}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{shipment.productName}</p>
        </div>
        {/* Current temp badge */}
        <div className={`card rounded-xl px-5 py-3 text-center border ${isCritical ? 'border-danger-200' : isSafe ? 'border-primary-200' : 'border-warning-200'}`}>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Live Temp</p>
          <p className={`text-lg font-bold font-mono ${statusColor}`}>{currentTemp.toFixed(1)}°C</p>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {infoCards.map(card => (
          <div key={card.label} className="card rounded-xl p-4 group hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-center gap-2.5 mb-2">
              <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center ${card.color}`}>{card.icon}</div>
              <span className="text-xs font-medium text-gray-500">{card.label}</span>
            </div>
            <p className={`text-[13px] font-medium truncate ${card.label === 'Breaches' && shipment.breachCount > 0 ? 'text-danger-600' : 'text-gray-800'}`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Gauge + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card rounded-2xl p-6 flex flex-col items-center justify-center">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-6">Current Temperature</h3>
          <TemperatureGauge currentTemp={currentTemp} minTemp={shipment.tempRange.min} maxTemp={shipment.tempRange.max} size={200} />
          <p className="text-xs text-gray-500 mt-4">
            Safe range: <span className="text-primary-600 font-mono font-semibold">{shipment.tempRange.min}°C</span> – <span className="text-primary-600 font-mono font-semibold">{shipment.tempRange.max}°C</span>
          </p>
        </div>

        <div className="lg:col-span-2 card rounded-2xl p-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Temperature History</h3>
          {telemetryData.length > 0 ? (
            <TemperatureChart data={telemetryData} minTemp={shipment.tempRange.min} maxTemp={shipment.tempRange.max} />
          ) : (
            <div className="h-72 flex items-center justify-center text-sm text-gray-400">No telemetry data yet</div>
          )}
        </div>
      </div>

      {/* Map + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Shipment Route</h3>
          </div>
          <div className="h-[350px]">
            <MapView routePoints={routePoints} singleMode />
          </div>
        </div>

        <div className="card rounded-2xl overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Alert Timeline</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[350px]">
            {(shipment.alerts || []).length === 0 ? (
              <div className="flex flex-col items-center py-10">
                <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500 font-medium">No alerts for this shipment</p>
              </div>
            ) : (
              shipment.alerts.map(a => <AlertCard key={a.id} alert={a} onAcknowledge={handleAcknowledge} />)
            )}
          </div>
        </div>
      </div>

      {/* Telemetry Table */}
      <div className="card rounded-2xl overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Telemetry Log</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">{Math.min(telemetryData.length, 50)} readings</p>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
            Real-time
          </div>
        </div>
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-gray-50">
              <tr>
                <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Timestamp</th>
                <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Temperature</th>
                <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Location</th>
                <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Battery</th>
              </tr>
            </thead>
            <tbody>
              {[...telemetryData].reverse().slice(0, 50).map((t, i) => {
                const safe = t.temperature >= shipment.tempRange.min && t.temperature <= shipment.tempRange.max;
                const crit = t.temperature > 10 || t.temperature < 0;
                return (
                  <tr key={t.id || i} className="border-t border-gray-50 hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-2.5 text-[12px] text-gray-500 font-mono">{new Date(t.timestamp).toLocaleString()}</td>
                    <td className="px-6 py-2.5">
                      <span className={`text-[13px] font-mono font-bold ${crit ? 'text-danger-600' : safe ? 'text-primary-600' : 'text-warning-600'}`}>
                        {t.temperature.toFixed(1)}°C
                      </span>
                    </td>
                    <td className="px-6 py-2.5 text-[12px] text-gray-500 font-mono">
                      {t.location?.lat?.toFixed(4)}, {t.location?.lng?.toFixed(4)}
                    </td>
                    <td className="px-6 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${t.battery > 50 ? 'bg-primary-500' : t.battery > 20 ? 'bg-warning-500' : 'bg-danger-500'}`}
                            style={{ width: `${Math.min(100, t.battery)}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-gray-500 font-mono w-8">
                          {typeof t.battery === 'number' ? t.battery.toFixed(0) : t.battery}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-gray-100 animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-32 bg-gray-100 rounded animate-pulse" />
          <div className="h-3 w-48 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[1,2,3,4].map(i => <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />)}
      </div>
      <div className="grid grid-cols-3 gap-6">
        <div className="h-80 rounded-2xl bg-gray-100 animate-pulse" />
        <div className="col-span-2 h-80 rounded-2xl bg-gray-100 animate-pulse" />
      </div>
    </div>
  );
}
