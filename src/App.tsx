import { Route, Routes } from "react-router-dom";
import { useAuth } from "./lib/auth";
import { Header } from "./components/Header";
import { Home } from "./pages/Home";
import { CircuitDetail } from "./pages/CircuitDetail";
import { ExerciseDetail } from "./pages/ExerciseDetail";
import { VideoLibrary } from "./pages/VideoLibrary";
import { AuthPage } from "./pages/AuthPage";

export function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="auth-loading">Beach Track Club…</div>;
  }

  // Auth gate: no app access until signed in.
  if (!user) {
    return <AuthPage />;
  }

  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/video-library" element={<VideoLibrary />} />
        <Route path="/circuit/:circuitId" element={<CircuitDetail />} />
        <Route path="/circuit/:circuitId/exercise/:exerciseId" element={<ExerciseDetail />} />
      </Routes>
    </>
  );
}
