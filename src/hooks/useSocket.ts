import { useEffect, useRef, useCallback, useState } from 'react';
import { io, type Socket } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export interface RoomPlayerInfo {
  name: string;
  index: number;
  connected: boolean;
  isHost: boolean;
  isCpu: boolean;
}

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [players, setPlayers] = useState<RoomPlayerInfo[]>([]);
  const [gameState, setGameState] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('room_updated', (data: { players: RoomPlayerInfo[] }) => {
      setPlayers(data.players);
    });

    socket.on('game_state', (state: unknown) => {
      setGameState(state);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const createRoom = useCallback((playerName: string) => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.emit('create_room', { playerName }, (res: { roomId: string; players: RoomPlayerInfo[] }) => {
      setRoomId(res.roomId);
      setPlayers(res.players);
      setError(null);
    });
  }, []);

  const joinRoom = useCallback((id: string, playerName: string) => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.emit('join_room', { roomId: id, playerName }, (res: { roomId?: string; players?: RoomPlayerInfo[]; error?: string }) => {
      if (res.error) {
        setError(res.error);
      } else {
        setRoomId(res.roomId!);
        setPlayers(res.players!);
        setError(null);
      }
    });
  }, []);

  const startGame = useCallback(() => {
    socketRef.current?.emit('start_game');
  }, []);

  const sendAction = useCallback((action: { type: string;[key: string]: unknown }) => {
    socketRef.current?.emit('game_action', action);
  }, []);

  const getRooms = useCallback((): Promise<{ id: string; playerCount: number; inGame: boolean }[]> => {
    return new Promise((resolve) => {
      socketRef.current?.emit('get_rooms', (res: { rooms: { id: string; playerCount: number; inGame: boolean }[] }) => {
        resolve(res.rooms);
      });
    });
  }, []);

  return {
    connected,
    roomId,
    players,
    gameState,
    error,
    createRoom,
    joinRoom,
    startGame,
    sendAction,
    getRooms,
  };
}
