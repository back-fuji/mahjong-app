# プロジェクト構成と責務の分離

## フォルダ構成（抜粋）

```
src/
├── core/           # ゲームロジック（フレームワーク非依存）
├── store/          # グローバル状態（Zustand）
├── pages/          # ルートに対応する画面
├── components/     # 再利用可能なUI部品
├── hooks/          # カスタムフック
├── ai/             # CPU 戦略
├── App.tsx
└── main.tsx
```

## core/ の役割

- **React に依存しない** ゲームのルール・状態遷移・計算を置く。
- `game-engine.ts` は「現在状態 + アクション」を受け取り「新しい状態」を返す **純粋関数** の集まり。
- `types/`, `agari/`, `score/`, `meld/`, `wall/` などはすべて「麻雀というドメイン」のロジック。
- 実務では **ビジネスロジックを UI やインフラから分離** するとテストしやすく、他プラットフォームにも流用しやすい。

## store/ の役割

- **Zustand** で「ゲーム状態」と「ユーザーが起こすアクション」を一括管理。
- `gameStore` が `initGame` / `processTsumo` / `processDiscard` などを呼び、得た新しい状態を `set({ gameState: newState })` で保存。
- ページやコンポーネントは **store を読むだけ** で、状態更新のロジックは store 内に閉じる。

## pages/ の役割

- **React Router** の 1 ルート = 1 ページコンポーネント。
- ページは「どの store を参照するか」「どの子コンポーネントを並べるか」を決める **組み立て役**。
- 細かい UI やゲームルールの計算はできるだけ `components/` や `core/` に任せる。

## components/ の役割

- **actions/** … 打牌・リーチ・ポン・チーなどのボタン群。
- **board/** … 盤面・捨て牌・中央情報。
- **hand/** … 手牌表示。
- **result/** … 結果モーダル・和了アナウンスなど。

同じデータ（例: `gameState`）を store から取り、表示とイベントだけを担当する。

## hooks/ の役割

- **useSocket** … Socket.IO の接続・ルーム参加・ゲーム開始・アクション送信をまとめたフック。
- ページは「接続状態」や「送信関数」だけを扱い、Socket の詳細をフックに隠す。

## 依存の向き（重要）

- `core/` → 他に依存しない（型以外は core 内で完結）。
- `store/` → `core/` を import してゲームエンジンを呼ぶ。
- `pages/`, `components/` → `store/`, `hooks/`, `core/types` を import。
- **UI が core を直接触らない** ようにすると、「ルール変更は core だけ」「UI 変更は components だけ」と切り分けやすい。
