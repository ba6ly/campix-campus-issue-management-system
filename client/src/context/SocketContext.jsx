import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [lastDashboardUpdate, setLastDashboardUpdate] = useState(Date.now());
  const [connected, setConnected] = useState(false);


  useEffect(() => {
    const newSocket = io(window.location.origin.replace('5173', '5000'), {
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      console.log('🔌 Socket connected');
      setConnected(true);
      if (user) {
        newSocket.emit('join', user._id);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
      setConnected(false);
    });

    newSocket.on('dashboard:update', (data) => {
      console.log('📊 Global Dashboard Update Received', data);
      setLastDashboardUpdate(data.ts || Date.now());
    });

    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, lastDashboardUpdate, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
};
