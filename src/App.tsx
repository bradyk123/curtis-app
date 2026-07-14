import { Route, Routes } from "react-router-dom";
import { useAuth } from "./lib/auth";
import { useProfile } from "./lib/profile";
import { Header } from "./components/Header";
import { Home } from "./pages/Home";
import { CircuitDetail } from "./pages/CircuitDetail";
import { ExerciseDetail } from "./pages/ExerciseDetail";
import { VideoLibrary } from "./pages/VideoLibrary";
import { AuthPage } from "./pages/AuthPage";
import { PendingScreen } from "./pages/PendingScreen";
import { AdminPanel } from "./pages/AdminPanel";

export function App() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();

  if (authLoading) return <div className="auth-loading">Beach Track Club…</div>;

  // Not signed in → sign in / sign up gate.
  if (!user) return <AuthPage />;

  // Signed in but profile still loading.
  if (profileLoading) return <div className="auth-loading">Beach Track Club…</div>;

  // Signed in but not approved → pending / rejected screen.
  if (!profile || profile.status !== "approved") return <PendingScreen />;

  // Approved → the app.
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/video-library" element={<VideoLibrary />} />
        <Route path="/circuit/:circuitId" element={<CircuitDetail />} />
        <Route path="/circuit/:circuitId/exercise/:exerciseId" element={<ExerciseDetail />} />
        {profile.is_admin && <Route path="/admin" element={<AdminPanel />} />}
      </Routes>
    </>
  );
}
