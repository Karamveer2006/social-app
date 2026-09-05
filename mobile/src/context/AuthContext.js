import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI, usersAPI } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStoredAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('taskplanet_mobile_token');
        const storedUser = await AsyncStorage.getItem('taskplanet_mobile_user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          const res = await authAPI.getMe();
          if (res.success && res.data.user) {
            setUser(res.data.user);
            await AsyncStorage.setItem('taskplanet_mobile_user', JSON.stringify(res.data.user));
          }
        }
      } catch (err) {
        console.warn('Session load error:', err);
        if (err.response?.status === 401) {
          await AsyncStorage.removeItem('taskplanet_mobile_token');
          await AsyncStorage.removeItem('taskplanet_mobile_user');
          setToken(null);
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    loadStoredAuth();
  }, []);

  const login = async (credentials) => {
    const res = await authAPI.login(credentials);
    if (res.success && res.data) {
      const { user: loggedInUser, token: authToken } = res.data;
      setUser(loggedInUser);
      setToken(authToken);
      await AsyncStorage.setItem('taskplanet_mobile_token', authToken);
      await AsyncStorage.setItem('taskplanet_mobile_user', JSON.stringify(loggedInUser));
      return { success: true };
    }
    return { success: false, message: res.message };
  };

  const signup = async (userData) => {
    const res = await authAPI.signup(userData);
    if (res.success && res.data) {
      const { user: registeredUser, token: authToken } = res.data;
      setUser(registeredUser);
      setToken(authToken);
      await AsyncStorage.setItem('taskplanet_mobile_token', authToken);
      await AsyncStorage.setItem('taskplanet_mobile_user', JSON.stringify(registeredUser));
      return { success: true };
    }
    return { success: false, message: res.message };
  };

  const logout = async () => {
    await AsyncStorage.removeItem('taskplanet_mobile_token');
    await AsyncStorage.removeItem('taskplanet_mobile_user');
    setUser(null);
    setToken(null);
  };

  const updateUser = async (updatedUserData) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedUserData };
      AsyncStorage.setItem('taskplanet_mobile_user', JSON.stringify(merged));
      return merged;
    });
  };

  const toggleFollowUser = async (targetUserId) => {
    try {
      const res = await usersAPI.toggleFollow(targetUserId);
      if (res.success && res.data) {
        const isFollowing = res.data.isFollowing;
        const actualTargetId = (res.data.targetUserId || targetUserId).toString();
        setUser((prev) => {
          if (!prev) return prev;
          const currentFollowing = (prev.following || []).map((id) => (id._id || id).toString());
          let updatedFollowing;
          if (isFollowing) {
            updatedFollowing = [...new Set([...currentFollowing, actualTargetId])];
          } else {
            updatedFollowing = currentFollowing.filter((id) => id !== actualTargetId);
          }
          const merged = {
            ...prev,
            following: updatedFollowing,
            followingCount: updatedFollowing.length,
          };
          AsyncStorage.setItem('taskplanet_mobile_user', JSON.stringify(merged));
          return merged;
        });
      }
      return res;
    } catch (err) {
      throw err;
    }
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
        updateUser,
        toggleFollowUser,
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
