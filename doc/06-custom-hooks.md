# カスタムフック

## カスタムフックとは

- **use で始まる関数** で、内部で useState / useEffect などを使い、**状態や振る舞いを再利用可能にした** もの。
- コンポーネントから「接続の詳細」や「イベント購読」を隠し、**何ができるか**（接続済みか、ルーム作成、送信など）だけを返す。

## useSocket（本PJ）

- **役割** … Socket.IO の接続・ルーム作成/参加・ゲーム開始・アクション送信・ルーム一覧取得。
- **返すもの** … `connected`, `roomId`, `players`, `gameState`, `error` と、`createRoom`, `joinRoom`, `startGame`, `sendAction`, `getRooms`。
- **内部** … `useRef` で Socket インスタンスを保持し、`useEffect` で `io(SERVER_URL)` とイベント登録、クリーンアップで `socket.disconnect()`。
- ページは「接続状態とメソッド」だけを使い、Socket の API を直接触らない。

## メモ（実務で意識すること）

- **重い処理・副作用をフックにまとめる** … 接続・購読・タイマーなどはフックに閉じ、コンポーネントは「結果とアクション」だけ使う。
- **返り値の型をはっきりさせる** … TypeScript で返り値の型を書くと利用側で間違った使い方をしにくい。
