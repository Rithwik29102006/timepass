import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import socket from '../socket';

const API = import.meta.env.DEV ? 'http://localhost:5001/api' : '/api';

const DemoContext = createContext({ demoActive: false, toggleDemo: () => {} });

export function DemoProvider({ children }) {
  const [demoActive, setDemoActive] = useState(false);

  // Fetch initial status on mount
  useEffect(() => {
    fetch(`${API}/demo/status`)
      .then(r => r.json())
      .then(d => setDemoActive(d.active))
      .catch(() => {});
  }, []);

  // Listen for real-time demo status changes
  useEffect(() => {
    const handler = (data) => setDemoActive(data.active);
    socket.on('demo:status', handler);
    return () => socket.off('demo:status', handler);
  }, []);

  const toggleDemo = useCallback(async () => {
    try {
      const endpoint = demoActive ? 'stop' : 'start';
      const res = await fetch(`${API}/demo/${endpoint}`, { method: 'POST' });
      const data = await res.json();
      setDemoActive(data.active);
    } catch (err) {
      console.error('Failed to toggle demo mode', err);
    }
  }, [demoActive]);

  return (
    <DemoContext.Provider value={{ demoActive, toggleDemo }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  return useContext(DemoContext);
}
