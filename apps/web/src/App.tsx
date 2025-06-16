import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from '@/pages/HomePage';
import { CreateGame } from '@/pages/CreateGame';
import { HostLobby } from '@/pages/HostLobby';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/create" element={<CreateGame />} />
        <Route path="/host/:code" element={<HostLobby />} />
        <Route
          path="/play/:code"
          element={<div className="p-4">Player View</div>}
        />
      </Routes>
    </BrowserRouter>
  );
}
