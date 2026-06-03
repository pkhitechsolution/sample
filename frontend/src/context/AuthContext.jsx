import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

const LOGIN_ENDPOINTS = [
  "/api/accounts/login/",
  "/api/accounts/auth/login/",
  "/api/users/auth/login/",
  "/api/login/",
  "/accounts/login/",
];

async function tryLoginRequest(credentials) {
  let lastError = null;

  for (const endpoint of LOGIN_ENDPOINTS) {
    try {
      const response = await api.post(endpoint, credentials);
      return response;
    } catch (error) {
      lastError = error;

      const status = error?.response?.status;

      if (status === 404) {
        continue;
      }

      throw error;
    }
  }

  throw lastError || new Error("No working login endpoint found.");
}

function extractToken(data) {
  return (
    data?.token ||
    data?.key ||
    data?.auth_token ||
    data?.access ||
    data?.data?.token ||
    data?.data?.key ||
    ""
  );
}

function extractUser(data, credentials) {
  return (
    data?.user ||
    data?.data?.user ||
    data?.profile ||
    data?.data?.profile ||
    {
      username: credentials?.username || "",
    }
  );
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("authToken") || "");
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    try {
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      localStorage.setItem("authToken", token);
    } else {
      localStorage.removeItem("authToken");
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  const login = async (credentials) => {
    setLoading(true);

    try {
      const response = await tryLoginRequest(credentials);
      const data = response?.data || {};

      const receivedToken = extractToken(data);
      const receivedUser = extractUser(data, credentials);

      if (!receivedToken) {
        throw new Error("Login succeeded, but token was not returned by the API.");
      }

      setToken(receivedToken);
      setUser(receivedUser);

      localStorage.setItem("authToken", receivedToken);
      localStorage.setItem("user", JSON.stringify(receivedUser));

      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken("");
    setUser(null);
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
  };

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: Boolean(token),
      login,
      logout,
      setUser,
    }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}