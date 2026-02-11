import type { YakuResult } from './yaku.ts';

/** 符の内訳項目 */
export interface FuDetail {
  reason: string;
  fu: number;
}

/** 点数計算結果 */
export interface ScoreResult {
  yaku: YakuResult[];      // 成立した役の一覧
  han: number;             // 合計翻数
  fu: number;              // 合計符 (切り上げ後)
  fuDetails: FuDetail[];   // 符の内訳
  basePoints: number;      // 基本点
  payment: PaymentInfo;    // 支払い情報
  isYakuman: boolean;      // 役満かどうか
  yakumanCount: number;    // 役満の倍数 (ダブル役満=2等)
  label: string;           // "満貫", "跳満", "倍満", "三倍満", "役満" 等
}

/** 支払い情報 */
export interface PaymentInfo {
  /** ロンの場合: 放銃者が支払う点数 */
  ron?: number;
  /** ツモの場合: 子が支払う点数 */
  tsumoKo?: number;
  /** ツモの場合: 親が支払う点数 */
  tsumoOya?: number;
  /** 合計獲得点数 */
  total: number;
}

/** 点数レベル */
export type ScoreLevel = 'normal' | 'mangan' | 'haneman' | 'baiman' | 'sanbaiman' | 'yakuman' | 'double_yakuman';

/** 点数レベル名 */
export const SCORE_LEVEL_NAMES: Record<ScoreLevel, string> = {
  normal: '',
  mangan: '満貫',
  haneman: '跳満',
  baiman: '倍満',
  sanbaiman: '三倍満',
  yakuman: '役満',
  double_yakuman: 'ダブル役満',
};
