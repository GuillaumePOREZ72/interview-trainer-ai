import { createContext, useState, useEffect, ReactNode } from "react";
import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";
import { User, UserContextType } from "../types";

export const UserContext = createContext<UserContextType | undefined>(
  undefined,
);

interface UserProviderProps {
  children: ReactNode;
}

const UserProvider = ({ children }: UserProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const updateUser = (userData: User) => {
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    setLoading(false);
  };

  const clearUser = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  const logout = async () => {
    try {
      await axiosInstance.post(API_PATHS.AUTH.LOGOUT);
    } catch {
      // même si le backend logout échoue, on veut quand même nettoyer le frontend
    } finally {
      clearUser();
    }
  };

  useEffect(() => {
    try {
      const cached = localStorage.getItem("user");
      if (cached) {
        setUser(JSON.parse(cached));
      }
    } catch {
      localStorage.removeItem("user");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <UserContext.Provider
      value={{ user, loading, updateUser, clearUser, logout }}
    >
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;
