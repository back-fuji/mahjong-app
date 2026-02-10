import { useGameStore } from './store/gameStore.ts';
import { MenuPage } from './pages/MenuPage.tsx';
import { GamePage } from './pages/GamePage.tsx';
import { GameResultScreen } from './components/result/GameResultScreen.tsx';
import { Lobby } from './components/lobby/Lobby.tsx';
import { OnlineGamePage } from './pages/OnlineGamePage.tsx';
import { useSocket } from './hooks/useSocket.ts';

function App() {
  const screen = useGameStore(s => s.screen);
  const gameState = useGameStore(s => s.gameState);
  const startGame = useGameStore(s => s.startGame);
  const backToMenu = useGameStore(s => s.backToMenu);
  const setScreen = useGameStore(s => s.setScreen);

  const socket = useSocket();

  if (screen === 'menu') {
    return <MenuPage />;
  }

  if (screen === 'lobby') {
    if (socket.gameState) {
      return (
        <OnlineGamePage
          gameState={socket.gameState}
          sendAction={socket.sendAction}
        />
      );
    }
    return (
      <Lobby
        connected={socket.connected}
        roomId={socket.roomId}
        players={socket.players}
        error={socket.error}
        onCreateRoom={socket.createRoom}
        onJoinRoom={socket.joinRoom}
        onStartGame={socket.startGame}
        onGetRooms={socket.getRooms}
        onBack={() => setScreen('menu')}
      />
    );
  }

  if (screen === 'result' && gameState) {
    return (
      <GameResultScreen
        players={gameState.players}
        onPlayAgain={() => startGame(gameState.rules)}
        onBackToMenu={backToMenu}
      />
    );
  }

  return <GamePage />;
}

export default App;
