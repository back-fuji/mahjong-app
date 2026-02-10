import type { Player, Wind } from './player.ts';
import type { TileInstance } from './tile.ts';
import type { ScoreResult } from './score.ts';
import type { CallOption } from './meld.ts';

/** ゲームのフェーズ */
export type GamePhase =
  | 'waiting'        // ゲーム開始前
  | 'dealing'        // 配牌中
  | 'tsumo'          // ツモ待ち
  | 'discard'        // 打牌選択中
  | 'calling'        // 鳴き応答待ち
  | 'riichi_confirm' // リーチ確認
  | 'kan_processing' // 槓処理中
  | 'round_result'   // 局結果表示
  | 'game_result'    // ゲーム終了結果
  ;

/** 局の状態 */
export interface RoundState {
  /** 場風 (東=0, 南=1) */
  bakaze: Wind;
  /** 局数 (0=東1局, 1=東2局, ...) */
  kyoku: number;
  /** 本場 */
  honba: number;
  /** リーチ棒供託 */
  riichiSticks: number;
  /** 残りツモ数 */
  remainingTiles: number;
  /** 巡目 */
  turn: number;
  /** 一巡目かどうか（ダブリー判定用） */
  isFirstTurn: boolean;
}

/** 和了結果 */
export interface AgariResult {
  winner: number;         // 和了者のインデックス
  loser: number;          // 放銃者のインデックス (-1ならツモ)
  isTsumo: boolean;
  scoreResult: ScoreResult;
}

/** 流局結果 */
export interface DrawResult {
  type: 'exhaustive' | 'kyuushu' | 'suufonrenda' | 'suukaikan' | 'suuchariichi' | 'sanchaho';
  tenpaiPlayers: number[];  // テンパイしているプレイヤー
  payments: number[];       // 各プレイヤーの収支
}

/** 局の結果 */
export interface RoundResult {
  agari?: AgariResult[];    // 和了 (ダブロン対応)
  draw?: DrawResult;        // 流局
}

/** ゲーム全体の状態 */
export interface GameState {
  /** プレイヤー (0=東, 1=南, 2=西, 3=北) */
  players: Player[];
  /** 山 */
  wall: TileInstance[];
  /** ツモ位置 */
  wallIndex: number;
  /** 嶺上牌位置 */
  rinshanIndex: number;
  /** ドラ表示牌 */
  doraIndicators: TileInstance[];
  /** 裏ドラ表示牌 */
  uraDoraIndicators: TileInstance[];
  /** 現在のフェーズ */
  phase: GamePhase;
  /** 現在のプレイヤーインデックス */
  currentPlayer: number;
  /** 局の状態 */
  round: RoundState;
  /** 最後に打たれた牌 */
  lastDiscard?: { tile: TileInstance; playerIndex: number };
  /** 鳴き選択肢（calling フェーズで使用） */
  callOptions?: Map<number, CallOption[]>;
  /** 局の結果 */
  roundResult?: RoundResult;
  /** 槓の回数（四槓散了判定用） */
  kanCount: number;
  /** ルール設定 */
  rules: GameRules;
}

/** ルール設定 */
export interface GameRules {
  /** 赤ドラ (5m, 5p, 5s 各1枚) */
  hasRedDora: boolean;
  /** 喰いタンあり */
  kuitan: boolean;
  /** 東風戦 or 半荘戦 */
  gameType: 'tonpu' | 'hanchan';
  /** 初期持ち点 */
  startScore: number;
}

/** デフォルトルール */
export const DEFAULT_RULES: GameRules = {
  hasRedDora: true,
  kuitan: true,
  gameType: 'hanchan',
  startScore: 25000,
};
