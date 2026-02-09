import { useEffect, useState } from 'react';
import socket from '../socket';

export function useSocket(event, handler) {
  useEffect(() => {
    socket.on(event, handler);
    return () => socket.off(event, handler);
  }, [event, handler]);
}

export function useRealtimeAlerts() {
  const [latestAlert, setLatestAlert] = useState(null);
  useSocket('alert:new', (alert) => setLatestAlert(alert));
  return latestAlert;
}

export function useRealtimeTelemetry() {
  const [latestTelemetry, setLatestTelemetry] = useState(null);
  useSocket('telemetry:update', (t) => setLatestTelemetry(t));
  return latestTelemetry;
}
