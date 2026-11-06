import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthAPI, getAuthToken, setAuthToken, removeAuthToken } from '../services/api';
import { startSignalR } from '../services/signalr';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const profile = await AuthAPI.getCurrentUser();
        setUser(profile);
        startSignalR();
      } catch (err) {
        console.warn('Failed to load current user profile:', err);
        removeAuthToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const handleUnauthorized = () => {
      setUser(null);
    };
    window.addEventListener('mbms_unauthorized', handleUnauthorized);
    return () => window.removeEventListener('mbms_unauthorized', handleUnauthorized);
  }, []);

  const login = async (username, password) => {
    const res = await AuthAPI.login(username, password);
    setAuthToken(res.token);
    setUser({
      userId: res.userId,
      employeeId: res.employeeId,
      employeeCode: res.employeeCode,
      employeeName: res.employeeName,
      designation: res.designation,
      departmentId: res.departmentId,
      departmentName: res.departmentName,
      roles: res.roles,
      mechanicId: res.mechanicId,
    });
    startSignalR();
    return res;
  };

  const logout = () => {
    removeAuthToken();
    setUser(null);
  };

  const hasRole = (role) => {
    if (!user || !user.roles) return false;
    return user.roles.includes(role) || user.roles.includes('ADMIN');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

