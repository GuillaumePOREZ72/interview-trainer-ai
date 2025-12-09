import { createContext, useState, useEffect, ReactNode } from "react";
import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";
import {User, UserContextType, AuthResponse} from "../types";

export const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

const UserProvider = ({ children }: UserProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (user) return;

    const accessToken = localStorage.getItem("token");
    if (!accessToken) {
      setLoading(false);
      return;
    }

    const fetchUser = async () => {
      try {
        const response = await axiosInstance.get<User>(API_PATHS.AUTH.GET_PROFILE);
        setUser(response.data);
      } catch (error) {
        clearUser();
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [user]);

  const updateUser = (userData: AuthResponse) => {
    setUser(userData.user);
    localStorage.setItem("token", userData.token); // Save token
    setLoading(false);
  };

  const clearUser = () => {
    setUser(null);
    localStorage.removeItem("token");
  };

  return (
    <UserContext.Provider value={{ user, loading, updateUser, clearUser }}>
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;
