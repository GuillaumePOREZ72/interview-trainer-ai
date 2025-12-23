import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";

import LandingPage from "./pages/LandingPage";
import InterviewPrep from "./pages/interviewPrep/components/InterviewPrep";
import Dashboard from "./pages/home/Dashboard";
import UserProvider from "./context/useContext";
import { useUser } from "./hooks/useUser";
import { ReactNode } from "react";
import { ThemeProvider } from "./context/ThemeContext";

interface ProtectedRoutesProps {
  children: ReactNode;
}

const ProtectedRoutes = ({ children }: ProtectedRoutesProps) => {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/" replace />;
};

const App = () => {
  return (
    <ThemeProvider defaultTheme="system" storageKey="theme">
      <UserProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoutes>
                  <Dashboard />
                </ProtectedRoutes>
              }
            />
            <Route
              path="/interview-prep/:sessionId"
              element={
                <ProtectedRoutes>
                  <InterviewPrep />
                </ProtectedRoutes>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          <Toaster
            toastOptions={{ className: "", style: { fontSize: "13px" } }}
          />
        </Router>
      </UserProvider>
    </ThemeProvider>
  );
};

export default App;
