import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('rental_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshNotifications = useCallback(async () => {
    const token = localStorage.getItem('rental_jwt_token');
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unread_count || 0);
    } catch {
      // ignore if token expired
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('rental_jwt_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
      localStorage.setItem('rental_user', JSON.stringify(res.data));
      await refreshNotifications();
    } catch {
      localStorage.removeItem('rental_jwt_token');
      localStorage.removeItem('rental_user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [refreshNotifications]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { access_token, user: loggedInUser } = res.data;
    localStorage.setItem('rental_jwt_token', access_token);
    localStorage.setItem('rental_user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    await refreshNotifications();
    return loggedInUser;
  };

  const register = async (payload) => {
    const res = await api.post('/auth/register', payload);
    const { access_token, user: registeredUser } = res.data;
    localStorage.setItem('rental_jwt_token', access_token);
    localStorage.setItem('rental_user', JSON.stringify(registeredUser));
    setUser(registeredUser);
    await refreshNotifications();
    return registeredUser;
  };

  const logout = () => {
    localStorage.removeItem('rental_jwt_token');
    localStorage.removeItem('rental_user');
    setUser(null);
    setNotifications([]);
    setUnreadCount(0);
  };

  const markNotificationRead = async (id) => {
    await api.put(`/notifications/${id}/read`);
    await refreshNotifications();
  };

  const markAllNotificationsRead = async () => {
    await api.put('/notifications/read-all');
    await refreshNotifications();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
        notifications,
        unreadCount,
        refreshNotifications,
        markNotificationRead,
        markAllNotificationsRead,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
