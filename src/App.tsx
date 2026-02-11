import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useGameStore } from './store/gameStore.ts';
import { MenuPage } from './pages/MenuPage.tsx';
import { GamePage } from './pages/GamePage.tsx';
import { LobbyPage } from './pages/LobbyPage.tsx';
import { GameResultScreen } from './components/result/GameResultScreen.tsx';

function App() {
  return (
    <Routes>
      <Route path="/" element={<MenuPage />} />
      <Route path="/game" element={<GameRoute />} />
      <Route path="/lobby" element={<LobbyPage />} />
      <Route path="/result" element={<ResultRoute />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/** CPU対戦ルート: ゲームが未開始なら自動で開始 */
function GameRoute() {
  const gameState = useGameStore(s => s.gameState);
  const startGame = useGameStore(s => s.startGame);

  useEffect(() => {
    if (!gameState) {
      startGame();
    }
  }, [gameState, startGame]);

  if (!gameState) return null;

  return <GamePage />;
}

/** 結果画面ルート */
function ResultRoute() {
  const navigate = useNavigate();
  const gameState = useGameStore(s => s.gameState);
  const startGame = useGameStore(s => s.startGame);

  if (!gameState) {
    return <Navigate to="/" replace />;
  }

  return (
    <GameResultScreen
      players={gameState.players}
      onPlayAgain={() => {
        startGame(gameState.rules);
        navigate('/game');
      }}
      onBackToMenu={() => {
        useGameStore.getState().backToMenu();
        navigate('/');
      }}
    />
  );
}

export default App;
