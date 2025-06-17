import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from '@/pages/HomePage';
import { CreateGame } from '@/pages/CreateGame';
import { HostLobby } from '@/pages/HostLobby';
import { JoinGame } from '@/pages/JoinGame';
import { PlayerWaitingRoom } from '@/pages/PlayerWaitingRoom';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/create" element={<CreateGame />} />
        <Route path="/host/:code" element={<HostLobby />} />
        <Route path="/join/:code" element={<JoinGame />} />
        <Route path="/play/:code" element={<PlayerWaitingRoom />} />
      </Routes>
    </BrowserRouter>
  );
}
