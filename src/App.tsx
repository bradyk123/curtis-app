import { Route, Routes } from "react-router-dom";
import { useAuth } from "./lib/auth";
import { useProfile } from "./lib/profile";
import { usePreviewAthlete, setPreviewAthlete } from "./lib/viewAs";
import { Header } from "./components/Header";
import { Home } from "./pages/Home";
import { CircuitDetail } from "./pages/CircuitDetail";
import { ExerciseDetail } from "./pages/ExerciseDetail";
import { VideoLibrary } from "./pages/VideoLibrary";
import { AuthPage } from "./pages/AuthPage";
import { ResetPassword } from "./pages/ResetPassword";
import { MfaChallenge } from "./pages/MfaChallenge";
import { PendingScreen } from "./pages/PendingScreen";
import { AdminPanel } from "./pages/AdminPanel";

export function App() {
  const { user, loading: authLoading, mfaRequired, recovery } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const previewing = usePreviewAthlete();

  if (authLoading) return <div className="auth-loading">Beach Track Club…</div>;

  // Following a password-reset email link → set a new password.
  if (recovery) return <ResetPassword />;

  // Not signed in → sign in / sign up gate.
  if (!user) return <AuthPage />;

  // Signed in but 2FA not yet satisfied → second-factor challenge.
  if (mfaRequired) return <MfaChallenge />;

  // Signed in but profile still loading.
  if (profileLoading) return <div className="auth-loading">Beach Track Club…</div>;

  // Signed in but not approved → pending / rejected screen.
  if (!profile || profile.status !== "approved") return <PendingScreen />;

  // Approved → the app.
  return (
    <>
      <Header />
      {previewing && (
        <div className="viewas-banner">
          <span>
            👁 Viewing as an <b>athlete</b> — coach tools are hidden.
          </span>
          <button className="viewas-banner-exit" onClick={() => setPreviewAthlete(false)}>
            Exit athlete view
          </button>
        </div>
      )}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/video-library" element={<VideoLibrary />} />
        <Route path="/circuit/:circuitId" element={<CircuitDetail />} />
        <Route path="/circuit/:circuitId/exercise/:exerciseId" element={<ExerciseDetail />} />
        {profile.is_admin && !previewing && <Route path="/admin" element={<AdminPanel />} />}
      </Routes>
    </>
  );
}
