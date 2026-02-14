# ルーティングとページ設計

## React Router DOM

- **BrowserRouter** を `main.tsx` でアプリ全体に 1 回だけ巻く。
- **Routes / Route** で「パス → コンポーネント」を定義する。

## ルート定義（App.tsx）

- `/` → MenuPage
- `/game` → GameRoute（中で GamePage）
- `/result` → ResultRoute（中で GameResultScreen）
- `/settings`, `/tutorial`, `/history` など → 各ページコンポーネント
- `*` → 存在しないパスは `/` へリダイレクト（Navigate）

## ガード付きルート

- **GameRoute** … `gameState` が無ければ `startGame()` を呼んでから `GamePage` を表示。ゲーム未開始のまま `/game` に来た場合のフォールバック。
- **ResultRoute** … `gameState` が無ければ `/` にリダイレクト。結果画面は「ゲーム終了後の状態」があるときだけ表示。

## メモ（実務で意識すること）

- **1 ルート = 1 ページ** で対応関係を分かりやすくする。
- 認証やデータの有無で表示を変えたい場合は、本PJの GameRoute / ResultRoute のように「ラッパーコンポーネント」でガードするパターンが使える。
