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

/** 全役の定義マスタ */
export const YAKU_DEFINITIONS: Record<YakuId, { name: string; reading: string; han: number; hanOpen: number; isYakuman: boolean }> = {
  // 1翻
  riichi:       { name: 'リーチ',   reading: 'リーチ', han: 1, hanOpen: -1, isYakuman: false },
  ippatsu:      { name: '一発',     reading: 'イッパツ', han: 1, hanOpen: -1, isYakuman: false },
  tsumo:        { name: '門前清自摸和', reading: 'メンゼンチンツモホー', han: 1, hanOpen: -1, isYakuman: false },
  tanyao:       { name: '断么九',   reading: 'タンヤオ', han: 1, hanOpen: 1,  isYakuman: false },
  pinfu:        { name: '平和',     reading: 'ピンフ', han: 1, hanOpen: -1, isYakuman: false },
  iipeiko:      { name: '一盃口',   reading: 'イーペーコー', han: 1, hanOpen: -1, isYakuman: false },
  yakuhai_haku:  { name: '役牌 白',  reading: 'ヤクハイ ハク', han: 1, hanOpen: 1, isYakuman: false },
  yakuhai_hatsu: { name: '役牌 發',  reading: 'ヤクハイ ハツ', han: 1, hanOpen: 1, isYakuman: false },
  yakuhai_chun:  { name: '役牌 中',  reading: 'ヤクハイ チュン', han: 1, hanOpen: 1, isYakuman: false },
  yakuhai_ton:   { name: '自風 東',  reading: 'ジカゼ トン', han: 1, hanOpen: 1, isYakuman: false },
  yakuhai_nan:   { name: '自風 南',  reading: 'ジカゼ ナン', han: 1, hanOpen: 1, isYakuman: false },
  yakuhai_sha:   { name: '自風 西',  reading: 'ジカゼ シャー', han: 1, hanOpen: 1, isYakuman: false },
  yakuhai_pei:   { name: '自風 北',  reading: 'ジカゼ ペー', han: 1, hanOpen: 1, isYakuman: false },
  bakaze_ton:    { name: '場風 東',  reading: 'バカゼ トン', han: 1, hanOpen: 1, isYakuman: false },
  bakaze_nan:    { name: '場風 南',  reading: 'バカゼ ナン', han: 1, hanOpen: 1, isYakuman: false },
  bakaze_sha:    { name: '場風 西',  reading: 'バカゼ シャー', han: 1, hanOpen: 1, isYakuman: false },
  bakaze_pei:    { name: '場風 北',  reading: 'バカゼ ペー', han: 1, hanOpen: 1, isYakuman: false },
  haitei:       { name: '海底摸月', reading: 'ハイテイモーユエ', han: 1, hanOpen: 1, isYakuman: false },
  houtei:       { name: '河底撈魚', reading: 'ホーテイラオユイ', han: 1, hanOpen: 1, isYakuman: false },
  rinshan:      { name: '嶺上開花', reading: 'リンシャンカイホウ', han: 1, hanOpen: 1, isYakuman: false },
  chankan:      { name: '槍槓',     reading: 'チャンカン', han: 1, hanOpen: 1, isYakuman: false },
  // 2翻
  double_riichi:     { name: 'ダブルリーチ', reading: 'ダブルリーチ', han: 2, hanOpen: -1, isYakuman: false },
  chanta:            { name: '混全帯么九',   reading: 'チャンタ', han: 2, hanOpen: 1,  isYakuman: false },
  ittsu:             { name: '一気通貫',     reading: 'イッツー', han: 2, hanOpen: 1,  isYakuman: false },
  sanshoku_doujun:   { name: '三色同順',     reading: 'サンショクドウジュン', han: 2, hanOpen: 1,  isYakuman: false },
  sanshoku_doukou:   { name: '三色同刻',     reading: 'サンショクドウコー', han: 2, hanOpen: 2,  isYakuman: false },
  toitoi:            { name: '対々和',       reading: 'トイトイホー', han: 2, hanOpen: 2,  isYakuman: false },
  sanankou:          { name: '三暗刻',       reading: 'サンアンコー', han: 2, hanOpen: 2,  isYakuman: false },
  honroutou:         { name: '混老頭',       reading: 'ホンロートー', han: 2, hanOpen: 2,  isYakuman: false },
  shousangen:        { name: '小三元',       reading: 'ショウサンゲン', han: 2, hanOpen: 2,  isYakuman: false },
  sankantsu:         { name: '三槓子',       reading: 'サンカンツ', han: 2, hanOpen: 2,  isYakuman: false },
  chiitoitsu:        { name: '七対子',       reading: 'チートイツ', han: 2, hanOpen: -1, isYakuman: false },
  // 3翻
  honitsu:   { name: '混一色',   reading: 'ホンイツ', han: 3, hanOpen: 2, isYakuman: false },
  junchan:   { name: '純全帯么九', reading: 'ジュンチャン', han: 3, hanOpen: 2, isYakuman: false },
  ryanpeiko: { name: '二盃口',   reading: 'リャンペーコー', han: 3, hanOpen: -1, isYakuman: false },
  // 6翻
  chinitsu:  { name: '清一色', reading: 'チンイツ', han: 6, hanOpen: 5, isYakuman: false },
  // 役満
  kokushi:         { name: '国士無双',       reading: 'コクシムソウ', han: 13, hanOpen: -1, isYakuman: true },
  kokushi_13men:   { name: '国士無双十三面', reading: 'コクシムソウ ジュウサンメンマチ', han: 26, hanOpen: -1, isYakuman: true },
  suuankou:        { name: '四暗刻',         reading: 'スーアンコー', han: 13, hanOpen: -1, isYakuman: true },
  suuankou_tanki:  { name: '四暗刻単騎',     reading: 'スーアンコー タンキ', han: 26, hanOpen: -1, isYakuman: true },
  daisangen:       { name: '大三元',         reading: 'ダイサンゲン', han: 13, hanOpen: 13, isYakuman: true },
  shousuushii:     { name: '小四喜',         reading: 'ショウスーシー', han: 13, hanOpen: 13, isYakuman: true },
  daisuushii:      { name: '大四喜',         reading: 'ダイスーシー', han: 26, hanOpen: 26, isYakuman: true },
  tsuuiisou:       { name: '字一色',         reading: 'ツーイーソー', han: 13, hanOpen: 13, isYakuman: true },
  chinroutou:      { name: '清老頭',         reading: 'チンロートー', han: 13, hanOpen: 13, isYakuman: true },
  ryuuiisou:       { name: '緑一色',         reading: 'リューイーソー', han: 13, hanOpen: 13, isYakuman: true },
  chuuren:         { name: '九蓮宝燈',       reading: 'チューレンポートー', han: 13, hanOpen: -1, isYakuman: true },
  chuuren_9men:    { name: '純正九蓮宝燈',   reading: 'ジュンセイチューレンポートー', han: 26, hanOpen: -1, isYakuman: true },
  suukantsu:       { name: '四槓子',         reading: 'スーカンツ', han: 13, hanOpen: 13, isYakuman: true },
  tenhou:          { name: '天和',           reading: 'テンホー', han: 13, hanOpen: -1, isYakuman: true },
  chiihou:         { name: '地和',           reading: 'チーホー', han: 13, hanOpen: -1, isYakuman: true },
};
