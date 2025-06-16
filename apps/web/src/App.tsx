import { BrowserRouter, Routes, Route } from 'react-router-dom';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div className="p-4">Welcome to Trivia Game</div>} />
        <Route path="/host/:code" element={<div className="p-4">Host View</div>} />
        <Route path="/play/:code" element={<div className="p-4">Player View</div>} />
      </Routes>
    </BrowserRouter>
  );
}