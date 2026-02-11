import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lobby } from '../components/lobby/Lobby.tsx';
import { OnlineGamePage } from './OnlineGamePage.tsx';
import { useSocket } from '../hooks/useSocket.ts';

export const LobbyPage: React.FC = () => {
  const navigate = useNavigate();
  const socket = useSocket();

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
      onBack={() => navigate('/')}
    />
  );
};
