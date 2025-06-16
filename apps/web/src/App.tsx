import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from '@/pages/HomePage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/host/:code"
          element={<div className="p-4">Host View</div>}
        />
        <Route
          path="/play/:code"
          element={<div className="p-4">Player View</div>}
        />
      </Routes>
    </BrowserRouter>
  );
}
