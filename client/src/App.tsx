import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LandingPage } from './pages/Landing';
import { LoginPage } from './pages/Login';
import { SavedCalculationsPage } from './pages/SavedCalculations';
import { QuizPage } from './pages/QuizPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/calculator" element={<QuizPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/saved" element={<SavedCalculationsPage />} />
      </Routes>
    </BrowserRouter>
  );
}
