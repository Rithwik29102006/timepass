import { io } from 'socket.io-client';

const URL = import.meta.env.DEV ? 'http://localhost:5001' : window.location.origin;
const socket = io(URL, {
  transports: ['websocket', 'polling'],
  reconnectionAttempts: import.meta.env.DEV ? Infinity : 3,
  timeout: 5000,
});

// In production (Vercel), Socket.IO won't be available — fail silently
if (!import.meta.env.DEV) {
  socket.on('connect_error', () => {
    socket.disconnect();
  });
}

export default socket;
