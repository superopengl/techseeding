import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiCall, isAuthenticated } from "../api";

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated()) {
      setUser(null);
      setLoaded(true);
      return null;
    }
    try {
      const data = await apiCall("/api/me");
      setUser(data);
      return data;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateAvatarColor = useCallback(async (avatarColor) => {
    const data = await apiCall("/api/me/avatar-color", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatarColor }),
    });
    setUser((prev) => (prev ? { ...prev, avatarColor: data.avatarColor } : prev));
    return data.avatarColor;
  }, []);

  const clear = useCallback(() => {
    setUser(null);
    setLoaded(true);
  }, []);

  return (
    <UserContext.Provider value={{ user, loaded, refresh, setUser, updateAvatarColor, clear }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return ctx;
}
