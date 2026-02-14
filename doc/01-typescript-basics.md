# TypeScript の重要概念（本PJで使っている部分）

## なぜ TypeScript か

- **型**で「値の形」を明示し、typo や null 参照をコンパイル時に減らせる。
- エディタの補完・リファクタが効き、大規模でも扱いやすい。
- 実務では「型を書くコスト」より「バグ削減・意図の明確化」のメリットが大きい。

## 型定義の置き場所（本PJ）

ドメインの型は **`src/core/types/`** に集約。

- `game-state.ts` … `GameState`, `GamePhase`, `RoundState`, `AgariResult` など
- `player.ts` … `Player`, `Wind`
- `tile.ts` … `TileInstance`, `TileId`, `TileCount34`
- `meld.ts` … `Meld`, `CallOption`, `MeldType`

UI や store はここで定義した型を import して使う。型を一箇所にまとめることで「ゲーム状態の形」がコード全体で一貫する。

## インターフェース（interface）

オブジェクトの「形」を約束する。

```ts
// src/core/types/game-state.ts のイメージ
export interface GameState {
  players: Player[];
  wall: TileInstance[];
  phase: GamePhase;
  currentPlayer: number;
  round: RoundState;
  // ...
}
```

- `?` でオプショナル（例: `lastDiscard?: { ... }`）。
- 実務では API レスポンス・ストアの状態・コンポーネントの props を interface で定義することが多い。

## ユニオン型（Union Types）

「いくつかの型のどれか」を表す。本PJではフェーズや流局理由で使用。

```ts
export type GamePhase =
  | 'waiting'
  | 'tsumo'
  | 'discard'
  | 'calling'
  | 'round_result'
  | 'game_result';
```

`phase` が `GamePhase` なら `'typo'` のような不正な文字列はコンパイルエラーになる。

## 型の import / export

- 型だけを import するときは `import type { GameState } from '...'` と書く。
- ビルド後の JS には型は残らないので、`import type` で「型専用」であることが明確になる。

## ジェネリクス（本PJでの使用例）

- Zustand の `create<GameStore>()` でストアの型を渡し、そのストア用の API を型安全にしている。
- React の `useState<GameState | null>(null)` で state の型を明示するのと同じ考え方。

## メモ（実務で意識すること）

- **型は「契約」** … 関数の引数・戻り値、コンポーネントの props を型で書くと、呼び出し側と実装側の齟齬が減る。
- **any はなるべく使わない** … 型を付けるコストを惜しむと後からバグやリファクタが辛くなる。
- **型定義はドメインの「用語」を決める** … 本PJでは `GameState`, `Player`, `TileInstance` などがそれに当たる。
