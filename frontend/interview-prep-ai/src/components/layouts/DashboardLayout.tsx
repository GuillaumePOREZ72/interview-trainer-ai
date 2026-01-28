import { ReactNode, useEffect, useState } from "react";
import { useUser } from "../../hooks/useUser";
import Navbar from "./Navbar";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { User } from "../../types";
import { useNavigate } from "react-router-dom";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, updateUser, clearUser } = useUser();
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axiosInstance.get<User>(API_PATHS.AUTH.GET_PROFILE);
        updateUser(res.data);
      } catch {
        clearUser();
        navigate("/"); // retour landing si pas auth
      } finally {
        setChecking(false);
      }
    };

    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <Navbar />
      {checking ? null : <div>{children}</div>}
    </div>
  );
};

export default DashboardLayout;
