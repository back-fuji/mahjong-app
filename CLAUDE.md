# 麻雀アプリ プロジェクト概要

## プロジェクト概要

このプロジェクトは、日本麻雀（リーチ麻雀）をプレイできるWebアプリケーションです。
CPU対戦とオンライン対人戦の2つのモードを提供します。

### 主な機能

- **CPU対戦モード**: ローカルでCPU 3人と対戦
- **オンライン対戦モード**: Socket.IOを使用したリアルタイムマルチプレイヤー対戦
- **完全な麻雀ルール実装**:
  - 和了判定（ツモ和了・ロン和了）
  - 役判定（30種類以上の役を実装）
  - 得点計算（符計算、翻計算）
  - リーチ、ポン、チー、カンの処理
  - 流局処理（九種九牌、四風子連打、四槓散了など）
  - 半荘戦・東風戦の対応
  - 赤ドラ、喰いタンあり/なしの設定

## 技術スタック

### フロントエンド
- **React 19** + **TypeScript**
- **Vite** (ビルドツール)
- **Tailwind CSS** (スタイリング)
- **Zustand** (状態管理)
- **Socket.IO Client** (リアルタイム通信)
- **React Router DOM** (ルーティング)
- **Vitest** + **@testing-library/react** (テスト)

### バックエンド
- **Express** (HTTPサーバー)
- **Socket.IO** (WebSocket通信)
- **TypeScript** (tsxで実行)
- **CORS** (クロスオリジン対応)

### デプロイ
- **フロントエンド**: Vercel
- **バックエンド**: Render

## プロジェクト構造

```
mahjong-app/
├── src/                          # フロントエンドソース
│   ├── components/               # Reactコンポーネント
│   │   ├── actions/             # アクションバー（リーチ、ポン、チーなど）
│   │   ├── board/               # 盤面表示（捨て牌、中央情報）
│   │   ├── hand/                # 手牌表示
│   │   ├── lobby/               # ロビー画面
│   │   ├── result/              # 結果画面
│   │   └── tile/                # 牌のSVGコンポーネント
│   ├── core/                    # ゲームロジック（コア）
│   │   ├── agari/               # 和了判定
│   │   ├── hand/                # 手牌ユーティリティ
│   │   ├── meld/                # 鳴き（ポン・チー・カン）処理
│   │   ├── score/               # 得点計算
│   │   ├── state/               # ゲームエンジン（状態管理）
│   │   ├── tile/                # 牌のユーティリティ
│   │   ├── types/               # TypeScript型定義
│   │   ├── wall/                # 山牌管理
│   │   └── yaku/                # 役判定
│   ├── ai/                      # CPUプレイヤーのAI
│   │   ├── efficiency/          # 効率計算
│   │   ├── shanten/             # 向聴数計算
│   │   └── strategy/             # 戦略（打牌選択、鳴き判断など）
│   ├── hooks/                   # カスタムフック
│   │   └── useSocket.ts         # Socket.IO接続管理
│   ├── pages/                   # ページコンポーネント
│   │   ├── MenuPage.tsx         # メニュー画面
│   │   ├── GamePage.tsx         # CPU対戦ゲーム画面
│   │   └── OnlineGamePage.tsx   # オンライン対戦ゲーム画面
│   ├── store/                   # 状態管理
│   │   └── gameStore.ts         # Zustandストア（CPU対戦用）
│   ├── App.tsx                  # ルートコンポーネント
│   └── main.tsx                 # エントリーポイント
├── server/                      # バックエンドソース
│   ├── index.ts                 # Express + Socket.IOサーバー
│   ├── room-manager.ts          # ルーム管理（作成、参加、切断処理）
│   └── server-game.ts           # サーバー側ゲームエンジン（権威型）
└── dist/                        # ビルド成果物
```

## ローカル環境での起動方法

### 前提条件
- Node.js (v18以上推奨)
- npm または yarn

### セットアップ

1. **依存関係のインストール**
```bash
npm install
```

**注意**: `concurrently` パッケージが `devDependencies` に含まれています。インストール後、`npm run dev:all` が使用可能になります。

2. **環境変数の設定（オプション）**
   - フロントエンド: `.env` ファイルを作成（必要に応じて）
     ```
     VITE_SERVER_URL=http://localhost:3001
     ```
   - バックエンド: 環境変数またはデフォルト値を使用
     - `PORT`: サーバーポート（デフォルト: 3001）
     - `CLIENT_URL`: CORS許可URL（デフォルト: `*`）

### 起動方法

#### 方法1: フロントエンドとバックエンドを同時に起動（推奨）
```bash
npm run dev:all
```
- フロントエンド: `http://localhost:5173` (Viteのデフォルトポート)
- バックエンド: `http://localhost:3001`

#### 方法2: 個別に起動

**フロントエンドのみ**
```bash
npm run dev
```
- ブラウザで `http://localhost:5173` にアクセス

**バックエンドのみ**
```bash
npm run server
```
- サーバーが `http://localhost:3001` で起動

### 利用可能なスクリプト

- `npm run dev` - フロントエンド開発サーバー起動
- `npm run server` - バックエンドサーバー起動
- `npm run dev:all` - フロントエンドとバックエンドを同時起動
- `npm run build` - フロントエンドをビルド
- `npm run preview` - ビルド済みアプリをプレビュー
- `npm run test` - テスト実行
- `npm run test:watch` - テストをウォッチモードで実行
- `npm run lint` - ESLintでコードチェック

## アーキテクチャ

### ゲームエンジン

ゲームロジックは `src/core/state/game-engine.ts` に集約されています。
純粋関数として実装されており、状態の不変性を保ちながらゲーム進行を管理します。

主要な関数:
- `initGame()` - ゲーム初期化
- `startRound()` - 局開始
- `processTsumo()` - ツモ処理
- `processDiscard()` - 打牌処理
- `processRiichi()` - リーチ処理
- `processTsumoAgari()` / `processRon()` - 和了処理
- `processPon()` / `processChi()` / `processAnKan()` など - 鳴き処理
- `advanceRound()` - 局進行

### CPU対戦モード

- **状態管理**: Zustand (`src/store/gameStore.ts`)
- **AI戦略**: `src/ai/strategy/strategy.ts`
  - 打牌選択: `chooseDiscard()`
  - 鳴き判断: `shouldCallPon()`, `shouldCallChi()`
  - リーチ判断: `shouldRiichi()`
  - 和了判断: `shouldTsumoAgari()`

### オンライン対戦モード

- **通信**: Socket.IO
- **サーバー側**: `server/server-game.ts` でゲーム状態を管理（権威型）
- **クライアント側**: `src/hooks/useSocket.ts` で接続管理
- **ルーム管理**: `server/room-manager.ts`
  - ルーム作成・参加
  - プレイヤー管理
  - 切断時のCPU代打（60秒猶予）

### Socket.IO イベント

**クライアント → サーバー**
- `create_room` - ルーム作成
- `join_room` - ルーム参加
- `start_game` - ゲーム開始
- `game_action` - ゲームアクション（打牌、リーチ、鳴きなど）
- `get_rooms` - 公開ルーム一覧取得

**サーバー → クライアント**
- `room_updated` - ルーム情報更新
- `game_state` - ゲーム状態更新

## 主要な型定義

- `GameState` - ゲーム全体の状態
- `Player` - プレイヤー情報
- `TileInstance` - 牌のインスタンス
- `Meld` - 鳴き（ポン・チー・カン）
- `GameRules` - ゲームルール設定
- `RoundState` - 局の状態

詳細は `src/core/types/` を参照。

## テスト

- **テストフレームワーク**: Vitest
- **テスト環境**: jsdom
- **テストファイル**: `src/core/state/__tests__/game-engine.test.ts`

## デプロイ設定

- **フロントエンド**: `vercel.json` でVercelにデプロイ
- **バックエンド**: `render.yaml` でRenderにデプロイ

## 開発時の注意事項

1. **ポート番号**
   - フロントエンド: 5173 (Viteデフォルト)
   - バックエンド: 3001

2. **CORS設定**
   - ローカル開発時は `CLIENT_URL=*` で全許可
   - 本番環境では適切なURLを設定

3. **環境変数**
   - フロントエンド: `VITE_` プレフィックスが必要
   - バックエンド: `PORT`, `CLIENT_URL`

4. **ゲームロジックの変更**
   - `src/core/` 配下のファイルを変更する際は、テストを確認
   - 状態の不変性を保つ（直接変更せず、新しい状態を返す）

## 今後の拡張可能性

- 観戦モード
- リプレイ機能
- ランキング・統計機能
- カスタムルール設定
- モバイル対応の最適化
