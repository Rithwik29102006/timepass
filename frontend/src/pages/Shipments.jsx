import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useRealtimeTelemetry } from '../hooks/useSocket';
import ShipmentForm from '../components/ShipmentForm';

export default function Shipments() {
  const [shipments, setShipments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();
  const latestTelemetry = useRealtimeTelemetry();

  const loadShipments = useCallback(async () => {
    try { setShipments(await api.getShipments()); }
    catch (err) { console.error(err); }
  }, []);

  useEffect(() => { loadShipments(); }, [loadShipments]);
  useEffect(() => { if (latestTelemetry) loadShipments(); }, [latestTelemetry, loadShipments]);

  const statusConfig = {
    'in-transit': { bg: 'bg-info-50', text: 'text-info-600', dot: 'bg-info-500', label: 'In Transit' },
    'delivered': { bg: 'bg-primary-50', text: 'text-primary-600', dot: 'bg-primary-500', label: 'Delivered' },
    'pending': { bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400', label: 'Pending' },
  };

  function getTempInfo(temp) {
    if (temp == null) return { color: 'text-gray-400', ring: '#e5e7eb', ratio: 0 };
    if (temp > 10 || temp < 0) return { color: 'text-danger-600', ring: '#ef4444', ratio: 1 };
    if (temp > 8 || temp < 2) return { color: 'text-warning-600', ring: '#f59e0b', ratio: 0.75 };
    return { color: 'text-primary-600', ring: '#22c55e', ratio: Math.min(Math.max((temp + 5) / 25, 0), 1) };
  }

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Shipments</h1>
          <p className="text-sm text-gray-500 mt-1">Track and manage cold-chain transports</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <svg className="w-4 h-4 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Create Shipment
        </button>
      </div>

      {/* Table */}
      <div className="card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-6 py-3.5">ID</th>
                <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-6 py-3.5">Product</th>
                <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-6 py-3.5">Route</th>
                <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-6 py-3.5">Device</th>
                <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-6 py-3.5">Temp</th>
                <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-6 py-3.5">Status</th>
                <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-6 py-3.5">Breaches</th>
                <th className="px-6 py-3.5"></th>
              </tr>
            </thead>
            <tbody>
              {shipments.map((s, i) => {
                const tempInfo = getTempInfo(s.lastTemperature);
                const status = statusConfig[s.status] || statusConfig.pending;
                return (
                  <tr
                    key={s.id}
                    onClick={() => navigate(`/shipments/${s.id}`)}
                    className="group cursor-pointer border-t border-gray-50 hover:bg-gray-50/60 transition-all duration-200"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <td className="px-6 py-4 relative">
                      <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary-500 rounded-r opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className="text-[13px] font-mono font-semibold text-primary-600">{s.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[13px] text-gray-700 font-medium">{s.productName}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[12px] text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-info-400" />
                          {s.origin.address}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary-400" />
                          {s.destination.address}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[12px] font-mono text-gray-500">{s.deviceId || '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="relative w-8 h-8 shrink-0">
                          <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="14" fill="none" stroke="#f3f4f6" strokeWidth="2.5" />
                            <circle cx="18" cy="18" r="14" fill="none"
                              stroke={tempInfo.ring} strokeWidth="2.5" strokeLinecap="round"
                              strokeDasharray={`${tempInfo.ratio * 88} 88`}
                              style={{ transition: 'stroke-dasharray 0.7s ease' }}
                            />
                          </svg>
                        </div>
                        <span className={`text-[13px] font-mono font-bold ${tempInfo.color}`}>
                          {s.lastTemperature != null ? `${s.lastTemperature.toFixed(1)}°` : '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${status.bg} ${status.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot} ${s.status === 'in-transit' ? 'animate-pulse' : ''}`} />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {s.breachCount > 0 ? (
                        <span className="text-[13px] font-bold text-danger-600">{s.breachCount}</span>
                      ) : (
                        <span className="text-[13px] text-gray-400">0</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <svg className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </td>
                  </tr>
                );
              })}
              {shipments.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-16">
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                        <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-600 font-medium">No shipments yet</p>
                      <p className="text-xs text-gray-400 mt-1">Create your first shipment to get started</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <ShipmentForm onClose={() => setShowForm(false)} onCreated={() => loadShipments()} />
      )}
    </div>
  );
}
