import { lazy, Suspense, ReactNode } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";

import UserProvider from "./context/UserContext";
import { useUser } from "./hooks/useUser";
import { ThemeProvider } from "./context/ThemeContext";
import SpinnerLoader from "./components/loader/SpinnerLoader";

// Lazy load pages
const LandingPage = lazy(() => import("./pages/LandingPage"));
const InterviewPrep = lazy(
  () => import("./pages/interviewPrep/components/InterviewPrep"),
);
const Dashboard = lazy(() => import("./pages/home/Dashboard"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const VoiceStudio = lazy(() => import("./pages/vocal/VoiceStudio"));
const MockInterviewSetup = lazy(
  () => import("./pages/interviewPrep/mockInterview/components/MockInterviewSetup"),
);
const MockInterviewSession = lazy(
  () => import("./pages/interviewPrep/mockInterview/components/MockInterviewSession"),
);

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
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-screen">
                <SpinnerLoader />
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route
                path="/reset-password/:resetToken"
                element={<ResetPassword />}
              />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoutes>
                    <Dashboard />
                  </ProtectedRoutes>
                }
              />
              <Route
                path="/interview-prep/:sessionId/vocal/:questionId"
                element={
                  <ProtectedRoutes>
                    <VoiceStudio />
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
              <Route
                path="/mock-interview/setup"
                element={
                  <ProtectedRoutes>
                    <MockInterviewSetup />
                  </ProtectedRoutes>
                }
              />
              <Route
                path="/mock-interview/session/:sessionId"
                element={
                  <ProtectedRoutes>
                    <MockInterviewSession />
                  </ProtectedRoutes>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>

          <Toaster
            toastOptions={{ className: "", style: { fontSize: "13px" } }}
          />
        </Router>
      </UserProvider>
    </ThemeProvider>
  );
};

export default App;
