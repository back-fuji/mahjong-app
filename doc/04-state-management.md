# 状態管理：Zustand と不変性

## なぜ Zustand か

- グローバル状態を「ストア」にまとめ、どのコンポーネントからも同じ状態を参照・更新できる。
- Redux よりシンプルでボイラープレートが少ない。本PJでは **ゲーム状態** と **人間プレイヤーの操作** を一括で扱うために使っている。

## ストアの形（gameStore）

- **State** … `gameState`, `humanPlayerIndex`, `selectedTile`, `screen` など。
- **Actions** … `startGame`, `discardTile`, `declareRiichi`, `callPon` など。
- これらを `create<GameStore>((set, get) => ({ ... }))` で 1 つのストアに定義している。

## 読み方（selector）

```tsx
const gameState = useGameStore(s => s.gameState);
const discardTile = useGameStore(s => s.discardTile);
```

- `s => s.gameState` のように **必要な部分だけ** 選ぶと、その部分が変わったときだけコンポーネントが再レンダーされる。
- 実務では「ストア全体を取る」のではなく **必要なスライスだけ取る** とパフォーマンスと意図が明確になる。

## 更新の流れ

1. ユーザーが「打牌」する → コンポーネントが `discardTile(tile)` を呼ぶ。
2. ストア内で `get().gameState` を取得し、`processDiscard(state, tile)`（core）を呼ぶ。
3. 返ってきた **新しい GameState** を `set({ gameState: newState })` で保存。
4. ストアを参照しているコンポーネントが再レンダーされ、新しい盤面が描画される。

## 不変性（Immutability）

- `game-engine.ts` は **既存の state を書き換えず**、新しいオブジェクトを返す。
- 例: `return { ...state, players, phase: 'tsumo', ... }` のようにスプレッドで新オブジェクトを作る。
- 不変にすると「状態の変化」が追いやすく、デバッグ・テスト・タイムトラベルなどがしやすい。React の考え方とも一致する。

## CPU ターンとの協調

- 人間の操作で `processDiscard` したあと、鳴き応答や次のツモなどは **ストア内の非同期処理**（`processCpuTurn`, `processCpuCallResponse`）で進める。
- `setTimeout` で少し遅延を入れてから次の CPU 手番を実行し、UI が追いつくようにしている。
