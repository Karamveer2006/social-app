import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('taskplanet_token');
      const storedUser = localStorage.getItem('taskplanet_user');

      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          // Verify with backend
          const res = await authAPI.getMe();
          if (res.success && res.data.user) {
            setUser(res.data.user);
            localStorage.setItem('taskplanet_user', JSON.stringify(res.data.user));
          }
        } catch (error) {
          console.warn('Session expired or invalid token:', error.message);
          localStorage.removeItem('taskplanet_token');
          localStorage.removeItem('taskplanet_user');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials) => {
    const res = await authAPI.login(credentials);
    if (res.success && res.data) {
      const { user, token } = res.data;
      setUser(user);
      setToken(token);
      localStorage.setItem('taskplanet_token', token);
      localStorage.setItem('taskplanet_user', JSON.stringify(user));
      return { success: true, user };
    }
    return { success: false, message: res.message };
  };

  const signup = async (userData) => {
    const res = await authAPI.signup(userData);
    if (res.success && res.data) {
      const { user, token } = res.data;
      setUser(user);
      setToken(token);
      localStorage.setItem('taskplanet_token', token);
      localStorage.setItem('taskplanet_user', JSON.stringify(user));
      return { success: true, user };
    }
    return { success: false, message: res.message };
  };

  const logout = () => {
    localStorage.removeItem('taskplanet_token');
    localStorage.removeItem('taskplanet_user');
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        loading,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
