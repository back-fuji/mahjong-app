import React, { useState, useEffect } from 'react';
import type { RoomPlayerInfo } from '../../hooks/useSocket.ts';

interface LobbyProps {
  connected: boolean;
  roomId: string | null;
  players: RoomPlayerInfo[];
  error: string | null;
  onCreateRoom: (name: string) => void;
  onJoinRoom: (roomId: string, name: string) => void;
  onStartGame: () => void;
  onGetRooms: () => Promise<{ id: string; playerCount: number; inGame: boolean }[]>;
  onBack: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({
  connected,
  roomId,
  players,
  error,
  onCreateRoom,
  onJoinRoom,
  onStartGame,
  onGetRooms,
  onBack,
}) => {
  const [name, setName] = useState('プレイヤー');
  const [joinId, setJoinId] = useState('');
  const [rooms, setRooms] = useState<{ id: string; playerCount: number; inGame: boolean }[]>([]);

  useEffect(() => {
    if (connected && !roomId) {
      onGetRooms().then(setRooms);
    }
  }, [connected, roomId, onGetRooms]);

  const isHost = players.length > 0 && players[0]?.isHost;

  if (!connected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-green-900">
        <div className="text-white text-center">
          <div className="animate-spin w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full mx-auto mb-4" />
          <p>サーバーに接続中...</p>
          <button onClick={onBack} className="mt-4 text-sm text-gray-400 underline">戻る</button>
        </div>
      </div>
    );
  }

  // ルーム内
  if (roomId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-green-900">
        <div className="bg-gray-900/90 rounded-2xl p-8 max-w-sm w-full mx-4 text-white">
          <h2 className="text-2xl font-bold text-center text-yellow-400 mb-2">ルーム</h2>
          <p className="text-center text-gray-400 mb-4 font-mono text-lg">{roomId}</p>

          <div className="space-y-2 mb-6">
            {players.map((p, i) => (
              <div
                key={i}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  p.isCpu ? 'bg-gray-800 text-gray-500' :
                  p.connected ? 'bg-green-900/50' : 'bg-red-900/50'
                }`}
              >
                <span>
                  {p.isHost && <span className="text-yellow-400 mr-1">&#9733;</span>}
                  {p.name}
                </span>
                <span className="text-xs">
                  {p.isCpu ? 'CPU' : p.connected ? '接続中' : '切断'}
                </span>
              </div>
            ))}
            {Array.from({ length: 4 - players.length }, (_, i) => (
              <div key={`empty_${i}`} className="p-3 rounded-lg bg-gray-800/50 text-gray-600 text-center">
                待機中...
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-400 text-center mb-4">
            2人以上でゲーム開始可能（残りはCPU補充）
          </p>

          {isHost && (
            <button
              onClick={onStartGame}
              className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-lg font-bold text-lg transition-colors mb-2"
            >
              ゲーム開始（{players.filter(p => !p.isCpu).length}人 + CPU {4 - players.filter(p => !p.isCpu).length}人）
            </button>
          )}

          <button
            onClick={onBack}
            className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
          >
            戻る
          </button>
        </div>
      </div>
    );
  }

  // ルーム選択画面
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-green-900">
      <div className="bg-gray-900/90 rounded-2xl p-8 max-w-sm w-full mx-4 text-white">
        <h2 className="text-2xl font-bold text-center text-yellow-400 mb-6">オンライン対戦</h2>

        {error && (
          <div className="bg-red-900/50 text-red-300 p-3 rounded-lg mb-4 text-sm">{error}</div>
        )}

        <div className="mb-6">
          <label className="block text-sm text-gray-400 mb-1">プレイヤー名</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-gray-800 rounded-lg px-4 py-2 text-white"
            maxLength={10}
          />
        </div>

        <button
          onClick={() => onCreateRoom(name)}
          className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-lg font-bold text-lg mb-4 transition-colors"
        >
          ルームを作成
        </button>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={joinId}
            onChange={(e) => setJoinId(e.target.value.toUpperCase())}
            placeholder="ルームID"
            className="flex-1 bg-gray-800 rounded-lg px-4 py-2 text-white font-mono"
            maxLength={5}
          />
          <button
            onClick={() => joinId && onJoinRoom(joinId, name)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold transition-colors"
          >
            参加
          </button>
        </div>

        {rooms.length > 0 && (
          <div>
            <h3 className="text-sm text-gray-400 mb-2">公開ルーム</h3>
            <div className="space-y-1">
              {rooms.filter(r => !r.inGame).map(r => (
                <button
                  key={r.id}
                  onClick={() => onJoinRoom(r.id, name)}
                  className="w-full flex justify-between p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
                >
                  <span className="font-mono">{r.id}</span>
                  <span>{r.playerCount}/4人</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={onBack}
          className="w-full mt-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
        >
          戻る
        </button>
      </div>
    </div>
  );
};
