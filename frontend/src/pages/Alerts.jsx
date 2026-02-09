import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { useRealtimeAlerts } from '../hooks/useSocket';
import AlertCard from '../components/AlertCard';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('all');
  const latestAlert = useRealtimeAlerts();

  const loadAlerts = useCallback(async () => {
    try {
      setAlerts(await api.getAlerts());
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => { loadAlerts(); }, [loadAlerts]);

  useEffect(() => {
    if (latestAlert) {
      setAlerts(prev => [latestAlert, ...prev.filter(a => a.id !== latestAlert.id)]);
    }
  }, [latestAlert]);

  const handleAcknowledge = async (id) => {
    await api.acknowledgeAlert(id);
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
  };

  const filtered = alerts.filter(a => {
    if (filter === 'critical') return a.severity === 'critical';
    if (filter === 'warning') return a.severity === 'warning';
    if (filter === 'unacknowledged') return !a.acknowledged;
    return true;
  });

  const counts = {
    all: alerts.length,
    critical: alerts.filter(a => a.severity === 'critical').length,
    warning: alerts.filter(a => a.severity === 'warning').length,
    unacknowledged: alerts.filter(a => !a.acknowledged).length,
  };

  const filterButtons = [
    { key: 'all', label: 'All', activeBg: 'bg-gray-800 text-white', icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
      </svg>
    )},
    { key: 'critical', label: 'Critical', activeBg: 'bg-danger-50 text-danger-700 ring-1 ring-danger-200', icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
    )},
    { key: 'warning', label: 'Warning', activeBg: 'bg-warning-50 text-warning-700 ring-1 ring-warning-200', icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    )},
    { key: 'unacknowledged', label: 'Unread', activeBg: 'bg-info-50 text-info-700 ring-1 ring-info-200', icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
      </svg>
    )},
  ];

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Alerts</h1>
          <p className="text-sm text-gray-500 mt-1">Monitor temperature breaches and device warnings</p>
        </div>
        {/* Live indicator */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-3.5 py-2 shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500" />
          </span>
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Real-time</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Alerts', value: counts.all, icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
          ), color: 'text-gray-600', bg: 'bg-gray-100', valueColor: 'text-gray-900' },
          { label: 'Critical', value: counts.critical, icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          ), color: 'text-danger-600', bg: 'bg-danger-50', valueColor: 'text-danger-700' },
          { label: 'Warning', value: counts.warning, icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          ), color: 'text-warning-600', bg: 'bg-warning-50', valueColor: 'text-warning-700' },
          { label: 'Unread', value: counts.unacknowledged, icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ), color: 'text-info-600', bg: 'bg-info-50', valueColor: 'text-info-700' },
        ].map(stat => (
          <div key={stat.label} className="card rounded-xl p-4 group hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-center gap-2.5 mb-2">
              <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center ${stat.color}`}>{stat.icon}</div>
              <span className="text-xs font-medium text-gray-500">{stat.label}</span>
            </div>
            <p className={`text-2xl font-bold font-mono ${stat.valueColor}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {filterButtons.map(btn => (
          <button
            key={btn.key}
            onClick={() => setFilter(btn.key)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-semibold transition-all duration-200 ${
              filter === btn.key
                ? btn.activeBg
                : 'bg-white border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {btn.icon}
            {btn.label}
            <span className={`ml-0.5 text-[11px] font-mono px-1.5 py-0.5 rounded-md ${
              filter === btn.key ? 'bg-black/5' : 'bg-gray-100'
            }`}>
              {counts[btn.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Alert Feed */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="card rounded-2xl py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-700">No alerts matching this filter</p>
            <p className="text-xs text-gray-400 mt-1">All systems operating normally</p>
          </div>
        ) : (
          filtered.map(alert => (
            <AlertCard key={alert.id} alert={alert} onAcknowledge={handleAcknowledge} />
          ))
        )}
      </div>
    </div>
  );
}
