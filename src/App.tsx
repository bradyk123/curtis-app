import { Route, Routes } from "react-router-dom";
import { Header } from "./components/Header";
import { Home } from "./pages/Home";
import { CircuitDetail } from "./pages/CircuitDetail";
import { ExerciseDetail } from "./pages/ExerciseDetail";

export function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/circuit/:circuitId" element={<CircuitDetail />} />
        <Route path="/circuit/:circuitId/exercise/:exerciseId" element={<ExerciseDetail />} />
      </Routes>
    </>
  );
}
