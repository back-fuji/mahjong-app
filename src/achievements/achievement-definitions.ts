/**
 * 実績定義
 */

export type AchievementCategory = 'basic' | 'yaku' | 'record' | 'special';

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  /** 段階的な実績の場合の最大値 */
  maxProgress?: number;
}

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  // ===== 基本 =====
  {
    id: 'first_game',
    name: '初めての対局',
    description: '初めて対局を完了した',
    icon: '🀄',
    category: 'basic',
  },
  {
    id: 'first_win',
    name: '初勝利',
    description: '初めてCPU対戦で1位になった',
    icon: '🏆',
    category: 'basic',
  },
  {
    id: 'first_tsumo',
    name: '初ツモ',
    description: '初めてツモ和了した',
    icon: '✋',
    category: 'basic',
  },
  {
    id: 'first_ron',
    name: '初ロン',
    description: '初めてロン和了した',
    icon: '👆',
    category: 'basic',
  },
  {
    id: 'first_riichi',
    name: '初リーチ',
    description: '初めてリーチ宣言して和了した',
    icon: '📢',
    category: 'basic',
  },
  // ===== 役 =====
  {
    id: 'yaku_tanyao',
    name: '断么九マスター',
    description: 'タンヤオで和了した',
    icon: '2️⃣',
    category: 'yaku',
  },
  {
    id: 'yaku_pinfu',
    name: '平和の達人',
    description: 'ピンフで和了した',
    icon: '🏔️',
    category: 'yaku',
  },
  {
    id: 'yaku_chiitoi',
    name: '七対子コレクター',
    description: '七対子で和了した',
    icon: '7️⃣',
    category: 'yaku',
  },
  {
    id: 'yaku_honitsu',
    name: '混一色使い',
    description: '混一色で和了した',
    icon: '🎨',
    category: 'yaku',
  },
  {
    id: 'yaku_chinitsu',
    name: '清一色使い',
    description: '清一色で和了した',
    icon: '💎',
    category: 'yaku',
  },
  {
    id: 'yaku_toitoi',
    name: '対々和の鬼',
    description: '対々和で和了した',
    icon: '🔨',
    category: 'yaku',
  },
  {
    id: 'yaku_ittsu',
    name: '一気通貫達成',
    description: '一気通貫で和了した',
    icon: '🚂',
    category: 'yaku',
  },
  {
    id: 'yaku_sanshoku',
    name: '三色同順',
    description: '三色同順で和了した',
    icon: '🌈',
    category: 'yaku',
  },
  {
    id: 'yakuman_achieved',
    name: '役満達成',
    description: '役満で和了した',
    icon: '👑',
    category: 'yaku',
  },
  {
    id: 'double_yakuman',
    name: 'ダブル役満',
    description: 'ダブル役満で和了した',
    icon: '💫',
    category: 'yaku',
  },
  // ===== 記録 =====
  {
    id: 'games_10',
    name: '常連',
    description: '10局プレイした',
    icon: '🎮',
    category: 'record',
    maxProgress: 10,
  },
  {
    id: 'games_50',
    name: 'ベテラン',
    description: '50局プレイした',
    icon: '⭐',
    category: 'record',
    maxProgress: 50,
  },
  {
    id: 'games_100',
    name: '雀士',
    description: '100局プレイした',
    icon: '🌟',
    category: 'record',
  },
  {
    id: 'wins_5',
    name: '5勝達成',
    description: 'CPU対戦で5回1位になった',
    icon: '🏅',
    category: 'record',
    maxProgress: 5,
  },
  {
    id: 'wins_20',
    name: '20勝達成',
    description: 'CPU対戦で20回1位になった',
    icon: '🥇',
    category: 'record',
    maxProgress: 20,
  },
  {
    id: 'mangan_count',
    name: '満貫10回',
    description: '満貫以上で10回和了した',
    icon: '💰',
    category: 'record',
    maxProgress: 10,
  },
  // ===== 特殊 =====
  {
    id: 'ippatsu_tsumo',
    name: '一発ツモ',
    description: 'リーチ一発でツモ和了した',
    icon: '⚡',
    category: 'special',
  },
  {
    id: 'ura_dora_3',
    name: '裏ドラ3枚',
    description: '裏ドラが3枚以上乗った',
    icon: '🎰',
    category: 'special',
  },
  {
    id: 'comeback_win',
    name: '大逆転',
    description: 'オーラスで4位から1位に逆転した',
    icon: '🔥',
    category: 'special',
  },
  {
    id: 'perfect_game',
    name: '完全勝利',
    description: '全員を3万点以上離して1位',
    icon: '🎯',
    category: 'special',
  },
  {
    id: 'haitei_win',
    name: '海底摸月',
    description: '海底牌（最後のツモ）で和了した',
    icon: '🌊',
    category: 'special',
  },
  {
    id: 'rinshan_win',
    name: '嶺上開花',
    description: '嶺上牌で和了した',
    icon: '🌸',
    category: 'special',
  },
];

export const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  basic: '基本',
  yaku: '役',
  record: '記録',
  special: '特殊',
};
