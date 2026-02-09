import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useRealtimeTelemetry, useRealtimeAlerts } from '../hooks/useSocket';
import { useDemo } from '../context/DemoContext';
import MapView from '../components/MapView';
import AlertCard from '../components/AlertCard';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [shipments, setShipments] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const latestTelemetry = useRealtimeTelemetry();
  const latestAlert = useRealtimeAlerts();
  const { demoActive, toggleDemo } = useDemo();
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    try {
      const [s, sh, al] = await Promise.all([api.getDashboardStats(), api.getShipments(), api.getAlerts()]);
      setStats(s);
      setShipments(sh);
      setAlerts(al.slice(0, 5));
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (latestTelemetry) {
      api.getDashboardStats().then(setStats).catch(() => {});
      api.getShipments().then(setShipments).catch(() => {});
    }
  }, [latestTelemetry]);

  useEffect(() => {
    if (latestAlert) {
      setAlerts(prev => [latestAlert, ...prev].slice(0, 5));
      api.getDashboardStats().then(setStats).catch(() => {});
    }
  }, [latestAlert]);

  const handleAcknowledge = async (id) => {
    await api.acknowledgeAlert(id);
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
  };

  if (!stats) return <LoadingSkeleton />;

  const statCards = [
    { label: 'Active Shipments', value: stats.activeShipments, color: 'text-primary-600', iconBg: 'bg-primary-50 text-primary-600', icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25m-12 4.5h12" /></svg>
    ) },
    { label: 'Devices Online', value: `${stats.devicesOnline}/${stats.totalDevices}`, color: 'text-gray-900', iconBg: 'bg-gray-100 text-gray-600', icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" /></svg>
    ) },
    { label: 'Active Alerts', value: stats.alertCount, color: 'text-warning-600', iconBg: 'bg-warning-50 text-warning-600', icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
    ) },
    { label: 'Temp Breaches', value: stats.totalBreaches, color: 'text-danger-600', iconBg: 'bg-danger-50 text-danger-600', icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" /></svg>
    ) },
  ];

  return (
    <div className="space-y-6 animate-fade-up">
      {/* DEMO MODE floating badge */}
      {demoActive && (
        <div className="fixed top-4 right-6 z-50 flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-full shadow-lg animate-fade-up">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider">Demo Mode</span>
        </div>
      )}

      {/* Header with search bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input type="text" placeholder="Search shipments" className="input-field pl-10" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Demo Mode Toggle */}
          <button
            onClick={toggleDemo}
            className={`group flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-semibold transition-all duration-300 border backdrop-blur-sm ${
              demoActive
                ? 'bg-primary-50 border-primary-200 text-primary-700 shadow-sm shadow-primary-100 hover:bg-primary-100'
                : 'bg-white/80 border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-white'
            }`}
          >
            {demoActive ? (
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
            {demoActive ? 'Stop Demo' : 'Demo Mode'}
            {demoActive && (
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary-500" />
              </span>
            )}
          </button>

          <button className="btn-primary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
            </svg>
            New alert
          </button>
          <button className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors relative">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            {alerts.filter(a => !a.acknowledged).length > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-danger-500" />
            )}
          </button>
          <button className="btn-secondary text-xs px-3" onClick={loadData}>Refresh</button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => (
          <div key={card.label} className="card-hover p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                {card.icon}
              </div>
            </div>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-xs text-gray-400 mt-1 font-medium">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Map & Recent Notifications — Two Column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="section-title text-base">Active Shipments</h2>
              <div className="flex items-center gap-4 mt-1.5">
                <span className="flex items-center gap-1.5 text-xs text-gray-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary-500" /> Safe
                </span>
                <span className="flex items-center gap-1.5 text-xs text-gray-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-warning-500" /> Warning
                </span>
                <span className="flex items-center gap-1.5 text-xs text-gray-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-danger-500" /> Critical
                </span>
              </div>
            </div>
          </div>
          <div className="h-[420px] p-3">
            <MapView shipments={shipments} />
          </div>
        </div>

        {/* Recent Notifications */}
        <div className="card overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="section-title text-base">Recent notifications</h2>
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
            </svg>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {alerts.length === 0 ? (
              <EmptyState message="No alerts yet" />
            ) : (
              alerts.map(alert => (
                <AlertCard key={alert.id} alert={alert} onAcknowledge={handleAcknowledge} />
              ))
            )}
          </div>
          <div className="px-5 py-3 border-t border-gray-100">
            <button onClick={() => navigate('/alerts')} className="text-sm text-primary-600 font-semibold hover:text-primary-700 transition-colors">
              View all alerts →
            </button>
          </div>
        </div>
      </div>

      {/* Active Shipments Feed */}
      {shipments.length > 0 && (
        <div>
          <h2 className="section-title mb-4">Active Shipments</h2>
          <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
            {shipments.filter(s => s.status === 'in-transit').map(s => {
              const temp = s.lastTemperature;
              const isSafe = temp != null && temp >= 2 && temp <= 8;
              const isCritical = temp != null && (temp > 10 || temp < 0);
              const tempColor = isCritical ? 'text-danger-600' : isSafe ? 'text-primary-600' : 'text-warning-600';
              const ringColor = isCritical ? '#ef4444' : isSafe ? '#22c55e' : '#f59e0b';

              return (
                <div
                  key={s.id}
                  onClick={() => navigate(`/shipments/${s.id}`)}
                  className="shrink-0 w-72 snap-start card-hover p-5 cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono text-gray-400 font-bold">{s.id}</span>
                    <span className="badge bg-primary-50 text-primary-700 text-[10px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
                      In Transit
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 truncate mb-1">{s.productName}</p>
                  <p className="text-xs text-gray-400 truncate">{s.origin.address} → {s.destination.address}</p>

                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Temperature</p>
                      <p className={`text-xl font-bold font-mono ${tempColor}`}>
                        {temp != null ? `${temp.toFixed(1)}°C` : '—'}
                      </p>
                    </div>
                    <div className="relative w-11 h-11">
                      <svg className="w-11 h-11 -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="14" fill="none" stroke="#f3f4f6" strokeWidth="3" />
                        <circle cx="18" cy="18" r="14" fill="none"
                          stroke={ringColor}
                          strokeWidth="3" strokeLinecap="round"
                          strokeDasharray={`${(temp != null ? Math.min(Math.max((temp + 5) / 25, 0), 1) : 0) * 88} 88`}
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <svg className="w-10 h-10 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-64 rounded-xl bg-gray-100 animate-pulse" />
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-28 rounded-2xl bg-gray-100 animate-pulse" />
        ))}
      </div>
      <div className="h-[420px] rounded-2xl bg-gray-100 animate-pulse" />
    </div>
  );
}
