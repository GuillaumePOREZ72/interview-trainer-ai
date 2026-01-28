import { ReactNode } from "react";
import { useUser } from "../../hooks/useUser";
import Navbar from "./Navbar";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, loading } = useUser();
  return (
    <div>
      <Navbar />
      {loading ? null : user ? <div>{children}</div> : null}
    </div>
  );
};

export default DashboardLayout;
