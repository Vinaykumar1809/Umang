import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './authContext.jsx';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { user, token, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && token) {
      const newSocket = io(import.meta.env.VITE_SERVER_URL || 'http://localhost:5000', {
        auth: {
          token
        }
      });

      newSocket.on('connect', () => {
        setSocket(newSocket);
      });

      newSocket.on('connect_error', (error) => {
        console.log('Connection failed:', error);
        toast.error('Failed to connect to server');
      });

      newSocket.on('notification', (notification) => {
        // Handle real-time notifications
        toast.success(notification.message, {
          duration: 4000,
          position: 'top-right'
        });
        
        // You can dispatch to notification context here
        // notificationDispatch({ type: 'ADD_NOTIFICATION', payload: notification });
      });

      newSocket.on('online_users', (users) => {
        setOnlineUsers(users);
      });

      return () => {
        newSocket.close();
        setSocket(null);
      };
    }
  }, [isAuthenticated, token, user]);

  const value = {
    socket,
    onlineUsers,
    isConnected: socket?.connected || false
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;
