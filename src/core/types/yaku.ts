/** 役の識別子 */
export type YakuId =
  // 1翻
  | 'riichi' | 'ippatsu' | 'tsumo' | 'tanyao' | 'pinfu'
  | 'iipeiko' | 'yakuhai_ton' | 'yakuhai_nan' | 'yakuhai_sha' | 'yakuhai_pei'
  | 'yakuhai_haku' | 'yakuhai_hatsu' | 'yakuhai_chun'
  | 'bakaze_ton' | 'bakaze_nan' | 'bakaze_sha' | 'bakaze_pei'
  | 'haitei' | 'houtei' | 'rinshan' | 'chankan'
  // 2翻
  | 'double_riichi' | 'chanta' | 'ittsu' | 'sanshoku_doujun'
  | 'sanshoku_doukou' | 'toitoi' | 'sanankou' | 'honroutou'
  | 'shousangen' | 'sankantsu' | 'chiitoitsu'
  // 3翻
  | 'honitsu' | 'junchan' | 'ryanpeiko'
  // 6翻
  | 'chinitsu'
  // 役満
  | 'kokushi' | 'kokushi_13men' | 'suuankou' | 'suuankou_tanki'
  | 'daisangen' | 'shousuushii' | 'daisuushii'
  | 'tsuuiisou' | 'chinroutou' | 'ryuuiisou'
  | 'chuuren' | 'chuuren_9men'
  | 'suukantsu' | 'tenhou' | 'chiihou';

/** 役の情報 */
export interface YakuResult {
  id: YakuId;
  name: string;       // 日本語名
  reading?: string;   // カタカナ読み
  han: number;        // 翻数 (門前)
  hanOpen: number;    // 翻数 (食い下がり, -1 = 門前限定)
  isYakuman: boolean; // 役満かどうか
}

/** 役定義の拡張（説明・条件付き） */
export interface YakuDefinition {
  name: string;
  reading: string;
  han: number;
  hanOpen: number;
  isYakuman: boolean;
  description: string;    // 役の説明
  condition: string;      // 成立条件
}

/** 全役の定義マスタ */
export const YAKU_DEFINITIONS: Record<YakuId, YakuDefinition> = {
  // 1翻
  riichi: {
    name: 'リーチ', reading: 'リーチ', han: 1, hanOpen: -1, isYakuman: false,
    description: '門前で聴牌した時に1000点を供託して宣言する。',
    condition: '門前で聴牌し、リーチを宣言する',
  },
  ippatsu: {
    name: '一発', reading: 'イッパツ', han: 1, hanOpen: -1, isYakuman: false,
    description: 'リーチ宣言後、1巡以内に和了した場合に成立。鳴きが入ると消える。',
    condition: 'リーチ後1巡以内に和了（途中で鳴きなし）',
  },
  tsumo: {
    name: '門前清自摸和', reading: 'メンゼンチンツモホー', han: 1, hanOpen: -1, isYakuman: false,
    description: '門前でツモ和了した場合に成立。',
    condition: '門前でツモ和了する',
  },
  tanyao: {
    name: '断么九', reading: 'タンヤオ', han: 1, hanOpen: 1, isYakuman: false,
    description: '么九牌（1,9,字牌）を含まない手で和了。数牌の2～8のみで構成。',
    condition: '手牌すべてが2～8の数牌のみ',
  },
  pinfu: {
    name: '平和', reading: 'ピンフ', han: 1, hanOpen: -1, isYakuman: false,
    description: '符が付かない形の和了。全て順子で、雀頭が役牌でなく、両面待ち。',
    condition: '門前・4順子・役牌以外の雀頭・両面待ち',
  },
  iipeiko: {
    name: '一盃口', reading: 'イーペーコー', han: 1, hanOpen: -1, isYakuman: false,
    description: '同じ順子が2つある形。',
    condition: '門前で同じ順子が2組ある',
  },
  yakuhai_haku: {
    name: '役牌 白', reading: 'ヤクハイ ハク', han: 1, hanOpen: 1, isYakuman: false,
    description: '白の刻子（3枚）があると成立。',
    condition: '白を3枚持っている（刻子/槓子）',
  },
  yakuhai_hatsu: {
    name: '役牌 發', reading: 'ヤクハイ ハツ', han: 1, hanOpen: 1, isYakuman: false,
    description: '發の刻子（3枚）があると成立。',
    condition: '發を3枚持っている（刻子/槓子）',
  },
  yakuhai_chun: {
    name: '役牌 中', reading: 'ヤクハイ チュン', han: 1, hanOpen: 1, isYakuman: false,
    description: '中の刻子（3枚）があると成立。',
    condition: '中を3枚持っている（刻子/槓子）',
  },
  yakuhai_ton: {
    name: '自風 東', reading: 'ジカゼ トン', han: 1, hanOpen: 1, isYakuman: false,
    description: '自分の風牌（東）の刻子があると成立。',
    condition: '自風が東の時、東を3枚持っている',
  },
  yakuhai_nan: {
    name: '自風 南', reading: 'ジカゼ ナン', han: 1, hanOpen: 1, isYakuman: false,
    description: '自分の風牌（南）の刻子があると成立。',
    condition: '自風が南の時、南を3枚持っている',
  },
  yakuhai_sha: {
    name: '自風 西', reading: 'ジカゼ シャー', han: 1, hanOpen: 1, isYakuman: false,
    description: '自分の風牌（西）の刻子があると成立。',
    condition: '自風が西の時、西を3枚持っている',
  },
  yakuhai_pei: {
    name: '自風 北', reading: 'ジカゼ ペー', han: 1, hanOpen: 1, isYakuman: false,
    description: '自分の風牌（北）の刻子があると成立。',
    condition: '自風が北の時、北を3枚持っている',
  },
  bakaze_ton: {
    name: '場風 東', reading: 'バカゼ トン', han: 1, hanOpen: 1, isYakuman: false,
    description: '場風（東）の刻子があると成立。東場で有効。',
    condition: '東場の時、東を3枚持っている',
  },
  bakaze_nan: {
    name: '場風 南', reading: 'バカゼ ナン', han: 1, hanOpen: 1, isYakuman: false,
    description: '場風（南）の刻子があると成立。南場で有効。',
    condition: '南場の時、南を3枚持っている',
  },
  bakaze_sha: {
    name: '場風 西', reading: 'バカゼ シャー', han: 1, hanOpen: 1, isYakuman: false,
    description: '場風（西）の刻子があると成立。',
    condition: '西場の時、西を3枚持っている',
  },
  bakaze_pei: {
    name: '場風 北', reading: 'バカゼ ペー', han: 1, hanOpen: 1, isYakuman: false,
    description: '場風（北）の刻子があると成立。',
    condition: '北場の時、北を3枚持っている',
  },
  haitei: {
    name: '海底摸月', reading: 'ハイテイモーユエ', han: 1, hanOpen: 1, isYakuman: false,
    description: '山の最後の牌（海底牌）でツモ和了。',
    condition: '最後のツモで和了する',
  },
  houtei: {
    name: '河底撈魚', reading: 'ホーテイラオユイ', han: 1, hanOpen: 1, isYakuman: false,
    description: '山が尽きる直前の最後の捨て牌でロン和了。',
    condition: '最後の捨て牌でロンする',
  },
  rinshan: {
    name: '嶺上開花', reading: 'リンシャンカイホウ', han: 1, hanOpen: 1, isYakuman: false,
    description: '槓をした後の嶺上牌でツモ和了。',
    condition: '槓した後の嶺上ツモで和了する',
  },
  chankan: {
    name: '槍槓', reading: 'チャンカン', han: 1, hanOpen: 1, isYakuman: false,
    description: '他家の加槓宣言時にロン和了。',
    condition: '他家の加槓の牌でロンする',
  },
  // 2翻
  double_riichi: {
    name: 'ダブルリーチ', reading: 'ダブルリーチ', han: 2, hanOpen: -1, isYakuman: false,
    description: '第一ツモ（最初のツモ）で聴牌していてリーチ宣言。',
    condition: '配牌で聴牌し、最初のツモでリーチ宣言（それまでに鳴きなし）',
  },
  chanta: {
    name: '混全帯么九', reading: 'チャンタ', han: 2, hanOpen: 1, isYakuman: false,
    description: '全ての面子と雀頭に么九牌（1,9,字牌）が含まれる。',
    condition: '全ての面子と雀頭に1,9,字牌を含む',
  },
  ittsu: {
    name: '一気通貫', reading: 'イッツー', han: 2, hanOpen: 1, isYakuman: false,
    description: '同じスートで123,456,789の3つの順子を作る。',
    condition: '同一スートで1-2-3, 4-5-6, 7-8-9の順子',
  },
  sanshoku_doujun: {
    name: '三色同順', reading: 'サンショクドウジュン', han: 2, hanOpen: 1, isYakuman: false,
    description: '萬子・筒子・索子で同じ数字の順子を作る。',
    condition: '3スートで同じ数字の順子（例: 1-2-3萬, 1-2-3筒, 1-2-3索）',
  },
  sanshoku_doukou: {
    name: '三色同刻', reading: 'サンショクドウコー', han: 2, hanOpen: 2, isYakuman: false,
    description: '萬子・筒子・索子で同じ数字の刻子を作る。',
    condition: '3スートで同じ数字の刻子（例: 5萬×3, 5筒×3, 5索×3）',
  },
  toitoi: {
    name: '対々和', reading: 'トイトイホー', han: 2, hanOpen: 2, isYakuman: false,
    description: '全て刻子（同じ牌3枚のグループ）で構成された手。',
    condition: '4つの面子が全て刻子',
  },
  sanankou: {
    name: '三暗刻', reading: 'サンアンコー', han: 2, hanOpen: 2, isYakuman: false,
    description: '暗刻（自力で集めた刻子）を3つ持っている。',
    condition: '暗刻が3組ある',
  },
  honroutou: {
    name: '混老頭', reading: 'ホンロートー', han: 2, hanOpen: 2, isYakuman: false,
    description: '么九牌（1,9,字牌）のみで構成された手。',
    condition: '手牌すべてが1,9,字牌のみ（対々和 or 七対子と複合）',
  },
  shousangen: {
    name: '小三元', reading: 'ショウサンゲン', han: 2, hanOpen: 2, isYakuman: false,
    description: '三元牌（白・發・中）のうち2つが刻子で、1つが雀頭。',
    condition: '三元牌の2種が刻子、1種が雀頭',
  },
  sankantsu: {
    name: '三槓子', reading: 'サンカンツ', han: 2, hanOpen: 2, isYakuman: false,
    description: '槓子を3つ持っている。',
    condition: '槓子が3組ある',
  },
  chiitoitsu: {
    name: '七対子', reading: 'チートイツ', han: 2, hanOpen: -1, isYakuman: false,
    description: '7つのペア（同じ牌2枚）で構成された特殊形。',
    condition: '門前で7種のペアを集める（全て異なるペア）',
  },
  // 3翻
  honitsu: {
    name: '混一色', reading: 'ホンイツ', han: 3, hanOpen: 2, isYakuman: false,
    description: '1種類の数牌と字牌のみで構成された手。',
    condition: '1スートの数牌＋字牌のみで手牌を構成',
  },
  junchan: {
    name: '純全帯么九', reading: 'ジュンチャン', han: 3, hanOpen: 2, isYakuman: false,
    description: '全ての面子と雀頭に1か9を含む（字牌なし）。',
    condition: '全面子と雀頭に1,9を含む（字牌を含まない）',
  },
  ryanpeiko: {
    name: '二盃口', reading: 'リャンペーコー', han: 3, hanOpen: -1, isYakuman: false,
    description: '同じ順子のペアが2組ある形。一盃口が2つ。',
    condition: '門前で同じ順子が2組×2',
  },
  // 6翻
  chinitsu: {
    name: '清一色', reading: 'チンイツ', han: 6, hanOpen: 5, isYakuman: false,
    description: '1種類の数牌のみで構成された手。字牌もなし。',
    condition: '1スートの数牌のみで手牌を構成',
  },
  // 役満
  kokushi: {
    name: '国士無双', reading: 'コクシムソウ', han: 13, hanOpen: -1, isYakuman: true,
    description: '13種類の么九牌を1枚ずつ集め、いずれかをもう1枚加えた特殊形。',
    condition: '13種の么九牌（1,9,字牌）を全種1枚ずつ＋いずれか1枚',
  },
  kokushi_13men: {
    name: '国士無双十三面', reading: 'コクシムソウ ジュウサンメンマチ', han: 26, hanOpen: -1, isYakuman: true,
    description: '国士無双の13面待ち。ダブル役満。',
    condition: '13種の么九牌を1枚ずつ揃え、13面待ちの状態で和了',
  },
  suuankou: {
    name: '四暗刻', reading: 'スーアンコー', han: 13, hanOpen: -1, isYakuman: true,
    description: '暗刻（鳴きなしの刻子）を4つ持つ。',
    condition: '門前で4つの暗刻を作る',
  },
  suuankou_tanki: {
    name: '四暗刻単騎', reading: 'スーアンコー タンキ', han: 26, hanOpen: -1, isYakuman: true,
    description: '四暗刻の単騎待ち。ダブル役満。',
    condition: '4つの暗刻＋単騎待ちで和了',
  },
  daisangen: {
    name: '大三元', reading: 'ダイサンゲン', han: 13, hanOpen: 13, isYakuman: true,
    description: '三元牌（白・發・中）すべてを刻子にする。',
    condition: '白・發・中の3種すべてが刻子',
  },
  shousuushii: {
    name: '小四喜', reading: 'ショウスーシー', han: 13, hanOpen: 13, isYakuman: true,
    description: '風牌（東南西北）のうち3つが刻子、1つが雀頭。',
    condition: '4種の風牌のうち3種が刻子、1種が雀頭',
  },
  daisuushii: {
    name: '大四喜', reading: 'ダイスーシー', han: 26, hanOpen: 26, isYakuman: true,
    description: '風牌（東南西北）すべてを刻子にする。ダブル役満。',
    condition: '東・南・西・北の4種すべてが刻子',
  },
  tsuuiisou: {
    name: '字一色', reading: 'ツーイーソー', han: 13, hanOpen: 13, isYakuman: true,
    description: '字牌のみで手牌を構成。',
    condition: '手牌すべてが字牌のみ',
  },
  chinroutou: {
    name: '清老頭', reading: 'チンロートー', han: 13, hanOpen: 13, isYakuman: true,
    description: '1と9の数牌のみで構成。',
    condition: '手牌すべてが1,9の数牌のみ（字牌なし）',
  },
  ryuuiisou: {
    name: '緑一色', reading: 'リューイーソー', han: 13, hanOpen: 13, isYakuman: true,
    description: '緑色の牌（2s,3s,4s,6s,8s,發）のみで構成。',
    condition: '2索,3索,4索,6索,8索,發のみで手牌を構成',
  },
  chuuren: {
    name: '九蓮宝燈', reading: 'チューレンポートー', han: 13, hanOpen: -1, isYakuman: true,
    description: '同一スートで1112345678999＋任意1枚の形。',
    condition: '門前で同一スート1112345678999の形＋同スート任意1枚',
  },
  chuuren_9men: {
    name: '純正九蓮宝燈', reading: 'ジュンセイチューレンポートー', han: 26, hanOpen: -1, isYakuman: true,
    description: '九蓮宝燈の9面待ち。ダブル役満。',
    condition: '1112345678999の形で9面待ちの状態で和了',
  },
  suukantsu: {
    name: '四槓子', reading: 'スーカンツ', han: 13, hanOpen: 13, isYakuman: true,
    description: '槓子を4つ作る。最も出にくい役満の一つ。',
    condition: '4つの槓子を作る',
  },
  tenhou: {
    name: '天和', reading: 'テンホー', han: 13, hanOpen: -1, isYakuman: true,
    description: '親の配牌時点で和了している。',
    condition: '親の配牌（第一ツモ）で和了形が完成している',
  },
  chiihou: {
    name: '地和', reading: 'チーホー', han: 13, hanOpen: -1, isYakuman: true,
    description: '子の第一ツモで和了。それまでに鳴きがないこと。',
    condition: '子の最初のツモで和了（それまでに鳴きなし）',
  },
};
