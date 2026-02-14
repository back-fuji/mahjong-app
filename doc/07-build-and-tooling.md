# ビルドとツール（Vite・型・テスト）

## Vite

- **役割** … 開発サーバー（HMR）と本番ビルド。TypeScript と JSX をそのまま扱う。
- **設定** … `vite.config.ts` で React プラグイン、Tailwind、PWA プラグインなどを指定。
- 実務では「どのディレクトリをエントリにするか」「alias で `@/` などをどう割り当てるか」を決める。

## TypeScript

- **tsconfig** … `tsconfig.app.json` などで `strict` を有効にし、型チェックを厳しくしている。
- `npm run typecheck`（`tsc -b`）でビルドなしに型だけ確認できる。CI で回すと安全。

## テスト（Vitest + Testing Library）

- **Vitest** … Vite と相性の良いテストランナー。`describe` / `it` / `expect` は Jest とほぼ同じ。
- **@testing-library/react** … コンポーネントを「ユーザー視点」でテストする（DOM や role で検証）。
- **setupFiles** … `src/test-setup.ts` で `@testing-library/jest-dom` を読み、`expect(...).toBeInTheDocument()` などを有効にしている。

## ゲームエンジンのテスト

- `src/core/state/__tests__/game-engine.test.ts` で、`initGame`, `processDiscard`, `processPon`, `processChi`, 流局系などを **純粋関数として** テストしている。
- 状態を直接いじらず「入力 state + アクション → 期待する state」を検証する形。core を UI から分離しているからこそ、こうした単体テストが書きやすい。

## メモ（実務で意識すること）

- **core の変更時はテストを動かす** … ルール変更の影響をテストで確認する。
- **型とテストの両方** … 型で「形」を保証し、テストで「振る舞い」を保証する。
