import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useGameStore } from './store/gameStore.ts';
import { useIsMobilePortrait } from './hooks/useIsMobilePortrait.ts';
import { LandscapePrompt } from './components/LandscapePrompt.tsx';
import { MenuPage } from './pages/MenuPage.tsx';
import { GamePage } from './pages/GamePage.tsx';
import { LobbyPage } from './pages/LobbyPage.tsx';
import { SettingsPage } from './pages/SettingsPage.tsx';
import { TutorialPage } from './pages/TutorialPage.tsx';
import { HistoryPage } from './pages/HistoryPage.tsx';
import { SaveLoadPage } from './pages/SaveLoadPage.tsx';
import { ReplayPage } from './pages/ReplayPage.tsx';
import { HelpPage } from './pages/HelpPage.tsx';
import { YakuListPage } from './pages/YakuListPage.tsx';
import { AchievementsPage } from './pages/AchievementsPage.tsx';
import { GameResultScreen } from './components/result/GameResultScreen.tsx';

function App() {
  return (
    <Routes>
      <Route path="/" element={<MenuPage />} />
      <Route path="/game" element={<GameRoute />} />
      <Route path="/lobby" element={<LobbyPage />} />
      <Route path="/result" element={<ResultRoute />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/tutorial" element={<TutorialPage />} />
      <Route path="/history" element={<HistoryPage />} />
      <Route path="/saves" element={<SaveLoadPage />} />
      <Route path="/replay/:id" element={<ReplayPage />} />
      <Route path="/help" element={<HelpPage />} />
      <Route path="/yaku" element={<YakuListPage />} />
      <Route path="/achievements" element={<AchievementsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/** CPU対戦ルート: ゲームが未開始なら自動で開始 */
function GameRoute() {
  const gameState = useGameStore(s => s.gameState);
  const startGame = useGameStore(s => s.startGame);
  const isMobilePortrait = useIsMobilePortrait();

  useEffect(() => {
    if (!gameState) {
      startGame();
    }
  }, [gameState, startGame]);

  if (!gameState) {
    return isMobilePortrait ? <LandscapePrompt /> : null;
  }

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
