import { io } from 'socket.io-client';

const URL = import.meta.env.DEV ? 'http://localhost:5001' : window.location.origin;
const socket = io(URL, { transports: ['websocket', 'polling'] });

export default socket;
