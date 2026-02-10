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
  han: number;        // 翻数 (門前)
  hanOpen: number;    // 翻数 (食い下がり, -1 = 門前限定)
  isYakuman: boolean; // 役満かどうか
}

/** 全役の定義マスタ */
export const YAKU_DEFINITIONS: Record<YakuId, { name: string; han: number; hanOpen: number; isYakuman: boolean }> = {
  // 1翻
  riichi:       { name: 'リーチ',   han: 1, hanOpen: -1, isYakuman: false },
  ippatsu:      { name: '一発',     han: 1, hanOpen: -1, isYakuman: false },
  tsumo:        { name: '門前清自摸和', han: 1, hanOpen: -1, isYakuman: false },
  tanyao:       { name: '断么九',   han: 1, hanOpen: 1,  isYakuman: false },
  pinfu:        { name: '平和',     han: 1, hanOpen: -1, isYakuman: false },
  iipeiko:      { name: '一盃口',   han: 1, hanOpen: -1, isYakuman: false },
  yakuhai_haku:  { name: '役牌 白',  han: 1, hanOpen: 1, isYakuman: false },
  yakuhai_hatsu: { name: '役牌 發',  han: 1, hanOpen: 1, isYakuman: false },
  yakuhai_chun:  { name: '役牌 中',  han: 1, hanOpen: 1, isYakuman: false },
  yakuhai_ton:   { name: '自風 東',  han: 1, hanOpen: 1, isYakuman: false },
  yakuhai_nan:   { name: '自風 南',  han: 1, hanOpen: 1, isYakuman: false },
  yakuhai_sha:   { name: '自風 西',  han: 1, hanOpen: 1, isYakuman: false },
  yakuhai_pei:   { name: '自風 北',  han: 1, hanOpen: 1, isYakuman: false },
  bakaze_ton:    { name: '場風 東',  han: 1, hanOpen: 1, isYakuman: false },
  bakaze_nan:    { name: '場風 南',  han: 1, hanOpen: 1, isYakuman: false },
  bakaze_sha:    { name: '場風 西',  han: 1, hanOpen: 1, isYakuman: false },
  bakaze_pei:    { name: '場風 北',  han: 1, hanOpen: 1, isYakuman: false },
  haitei:       { name: '海底摸月', han: 1, hanOpen: 1, isYakuman: false },
  houtei:       { name: '河底撈魚', han: 1, hanOpen: 1, isYakuman: false },
  rinshan:      { name: '嶺上開花', han: 1, hanOpen: 1, isYakuman: false },
  chankan:      { name: '槍槓',     han: 1, hanOpen: 1, isYakuman: false },
  // 2翻
  double_riichi:     { name: 'ダブルリーチ', han: 2, hanOpen: -1, isYakuman: false },
  chanta:            { name: '混全帯么九',   han: 2, hanOpen: 1,  isYakuman: false },
  ittsu:             { name: '一気通貫',     han: 2, hanOpen: 1,  isYakuman: false },
  sanshoku_doujun:   { name: '三色同順',     han: 2, hanOpen: 1,  isYakuman: false },
  sanshoku_doukou:   { name: '三色同刻',     han: 2, hanOpen: 2,  isYakuman: false },
  toitoi:            { name: '対々和',       han: 2, hanOpen: 2,  isYakuman: false },
  sanankou:          { name: '三暗刻',       han: 2, hanOpen: 2,  isYakuman: false },
  honroutou:         { name: '混老頭',       han: 2, hanOpen: 2,  isYakuman: false },
  shousangen:        { name: '小三元',       han: 2, hanOpen: 2,  isYakuman: false },
  sankantsu:         { name: '三槓子',       han: 2, hanOpen: 2,  isYakuman: false },
  chiitoitsu:        { name: '七対子',       han: 2, hanOpen: -1, isYakuman: false },
  // 3翻
  honitsu:   { name: '混一色',   han: 3, hanOpen: 2, isYakuman: false },
  junchan:   { name: '純全帯么九', han: 3, hanOpen: 2, isYakuman: false },
  ryanpeiko: { name: '二盃口',   han: 3, hanOpen: -1, isYakuman: false },
  // 6翻
  chinitsu:  { name: '清一色', han: 6, hanOpen: 5, isYakuman: false },
  // 役満
  kokushi:         { name: '国士無双',       han: 13, hanOpen: -1, isYakuman: true },
  kokushi_13men:   { name: '国士無双十三面', han: 26, hanOpen: -1, isYakuman: true },
  suuankou:        { name: '四暗刻',         han: 13, hanOpen: -1, isYakuman: true },
  suuankou_tanki:  { name: '四暗刻単騎',     han: 26, hanOpen: -1, isYakuman: true },
  daisangen:       { name: '大三元',         han: 13, hanOpen: 13, isYakuman: true },
  shousuushii:     { name: '小四喜',         han: 13, hanOpen: 13, isYakuman: true },
  daisuushii:      { name: '大四喜',         han: 26, hanOpen: 26, isYakuman: true },
  tsuuiisou:       { name: '字一色',         han: 13, hanOpen: 13, isYakuman: true },
  chinroutou:      { name: '清老頭',         han: 13, hanOpen: 13, isYakuman: true },
  ryuuiisou:       { name: '緑一色',         han: 13, hanOpen: 13, isYakuman: true },
  chuuren:         { name: '九蓮宝燈',       han: 13, hanOpen: -1, isYakuman: true },
  chuuren_9men:    { name: '純正九蓮宝燈',   han: 26, hanOpen: -1, isYakuman: true },
  suukantsu:       { name: '四槓子',         han: 13, hanOpen: 13, isYakuman: true },
  tenhou:          { name: '天和',           han: 13, hanOpen: -1, isYakuman: true },
  chiihou:         { name: '地和',           han: 13, hanOpen: -1, isYakuman: true },
};
