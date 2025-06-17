import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from '@/pages/HomePage';
import { CreateGame } from '@/pages/CreateGame';
import { HostLobby } from '@/pages/HostLobby';
import { HostGameView } from '@/pages/HostGameView';
import { JoinGame } from '@/pages/JoinGame';
import { PlayerWaitingRoom } from '@/pages/PlayerWaitingRoom';
import { PlayerGameView } from '@/pages/PlayerGameView';
import { GameOverView } from '@/pages/GameOverView';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/create" element={<CreateGame />} />
        <Route path="/host/:code" element={<HostLobby />} />
        <Route path="/host/:code/game" element={<HostGameView />} />
        <Route path="/host/:code/results" element={<GameOverView isHost />} />
        <Route path="/join/:code" element={<JoinGame />} />
        <Route path="/play/:code" element={<PlayerWaitingRoom />} />
        <Route path="/play/:code/game" element={<PlayerGameView />} />
        <Route path="/play/:code/results" element={<GameOverView />} />
      </Routes>
    </BrowserRouter>
  );
}
