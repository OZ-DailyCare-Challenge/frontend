import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/Landing/LandingPage";
import LoginPage from "./pages/Login/LoginPage";
import HealthInputPage from "./pages/HealthInput/HealthInputPage";
import ResultPage from "./pages/Result/ResultPage";
import DashboardPage from "./pages/Dashboard/DashboardPage";
import ChallengePage from "./pages/Challenge/ChallengePage";
import AnalysisLoadingPage from "./pages/AnalysisLoading/AnalysisLoadingPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/health-input" element={<HealthInputPage />} />
      <Route path="/analysis-loading" element={<AnalysisLoadingPage />} />
      <Route path="/result" element={<ResultPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/challenge" element={<ChallengePage />} />
    </Routes>
  );
}

export default App;