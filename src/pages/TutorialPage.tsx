import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { YAKU_DEFINITIONS } from '../core/types/yaku.ts';

const STEPS = [
  {
    title: '麻雀の基本',
    content: `麻雀は4人で行うテーブルゲームです。136枚の牌（タイル）を使い、手牌を揃えて和了（アガリ）を目指します。

各プレイヤーは13枚の手牌を持ち、交互に牌を1枚ツモ（山から引く）して1枚捨てることを繰り返します。

14枚で決められた形を完成させると「和了」となり、点数を獲得できます。`,
  },
  {
    title: '牌の種類',
    content: `麻雀の牌は大きく分けて4種類あります：

【数牌（シューパイ）】
・萬子（マンズ）: 1m〜9m — 赤い漢数字
・筒子（ピンズ）: 1p〜9p — 丸い模様
・索子（ソーズ）: 1s〜9s — 竹の模様

【字牌（ジハイ）】
・風牌（フォンパイ）: 東・南・西・北
・三元牌（サンゲンパイ）: 白・發・中

各牌は4枚ずつ、合計136枚です。
赤ドラありの場合、5m/5p/5sに各1枚の赤牌が含まれます。`,
  },
  {
    title: '和了（アガリ）の形',
    content: `基本的な和了の形は「4面子1雀頭」です。

【面子（メンツ）】= 3枚の組み合わせ
・順子（シュンツ）: 同じスートの連番3枚（例: 1m-2m-3m）
・刻子（コーツ）: 同じ牌3枚（例: 5p-5p-5p）

【雀頭（ジャントウ）】= 同じ牌2枚（例: 東-東）

つまり (3×4) + 2 = 14枚 で完成！

※七対子（チートイツ）や国士無双のような特殊形もあります。`,
  },
  {
    title: 'ゲームの流れ',
    content: `1. 配牌: 各プレイヤーに13枚配る
2. 親（東家）がツモして14枚にする
3. 不要な牌を1枚捨てる
4. 次のプレイヤーがツモして捨てる
5. これを繰り返す

【和了の方法】
・ツモ和了: 自分でツモった牌で完成
・ロン和了: 他家が捨てた牌で完成

【特別なアクション】
・リーチ: テンパイ時に宣言（1000点を供託）
・ポン: 他家の捨て牌で刻子を完成
・チー: 上家の捨て牌で順子を完成
・カン: 同じ牌4枚でカンを宣言`,
  },
  {
    title: '操作方法',
    content: `【基本操作】
・牌をクリック: 牌を選択
・牌をダブルクリック: 牌を選択して即打牌
・打牌ボタン: 選択中の牌を捨てる

【鳴き操作】
相手の捨て牌に対して以下が表示されます：
・ポン: 手牌から同じ牌2枚を出して刻子を作る
・チー: 手牌から2枚を出して順子を作る（上家の捨て牌のみ）
・カン: 手牌から3枚を出してカンをする
・スキップ: 鳴かずにパスする

【リーチ】
テンパイ（あと1枚で和了）の状態で「リーチ」ボタンが表示されます。

【テンパイ表示】
右下にテンパイ状態と待ち牌が表示されます。
フリテン（自分の捨て牌に待ち牌がある状態）の時は赤く表示されます。`,
  },
  {
    title: '得点計算',
    content: `和了すると「役」に応じた点数を獲得します。

【翻（ハン）】
役の数を翻数で表します。翻が多いほど高い点数になります。

【符（フ）】
和了形や待ちの種類で決まる点数の基本単位です。

【点数の段階】
・満貫（マンガン）: 5翻〜 = 8000点（子）/ 12000点（親）
・跳満（ハネマン）: 6-7翻 = 12000点（子）/ 18000点（親）
・倍満（バイマン）: 8-10翻 = 16000点（子）/ 24000点（親）
・三倍満（サンバイマン）: 11-12翻 = 24000点（子）/ 36000点（親）
・役満（ヤクマン）: 特殊 = 32000点（子）/ 48000点（親）
・ダブル役満: 64000点（子）/ 96000点（親）`,
  },
];

export const TutorialPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [showYakuList, setShowYakuList] = useState(false);

  const yakuEntries = Object.entries(YAKU_DEFINITIONS);
  const normalYaku = yakuEntries.filter(([, v]) => !v.isYakuman);
  const yakumanYaku = yakuEntries.filter(([, v]) => v.isYakuman);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-green-900 text-white p-4">
      <div className="max-w-lg mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6 text-yellow-400">チュートリアル</h1>

        {!showYakuList ? (
          <>
            {/* ステップ表示 */}
            <div className="bg-gray-800/80 rounded-2xl p-6 mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-400">
                  {currentStep + 1} / {STEPS.length}
                </span>
                <h2 className="text-xl font-bold text-orange-300">{STEPS[currentStep].title}</h2>
                <div />
              </div>

              {/* プログレスバー */}
              <div className="w-full bg-gray-700 rounded-full h-1.5 mb-4">
                <div
                  className="bg-yellow-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
                />
              </div>

              <div className="text-gray-200 text-sm whitespace-pre-line leading-relaxed">
                {STEPS[currentStep].content}
              </div>
            </div>

            {/* ナビゲーション */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium
                  transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                前へ
              </button>
              <button
                onClick={() => setCurrentStep(Math.min(STEPS.length - 1, currentStep + 1))}
                disabled={currentStep === STEPS.length - 1}
                className="flex-1 py-2.5 bg-yellow-600 hover:bg-yellow-700 rounded-xl font-medium
                  transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                次へ
              </button>
            </div>

            {/* 役一覧ボタン */}
            <button
              onClick={() => setShowYakuList(true)}
              className="w-full py-2.5 bg-orange-600/80 hover:bg-orange-600 rounded-xl font-medium
                transition-all mb-4"
            >
              役一覧を見る
            </button>
          </>
        ) : (
          /* 役一覧表 */
          <>
            <div className="bg-gray-800/80 rounded-2xl p-4 mb-4 max-h-[60vh] overflow-y-auto">
              <h2 className="text-lg font-bold text-orange-300 mb-3">通常役</h2>
              <div className="space-y-1">
                {normalYaku.map(([key, yaku]) => (
                  <div key={key} className="flex justify-between items-center py-1.5 border-b border-gray-700/50">
                    <div>
                      <span className="text-sm text-white">{yaku.name}</span>
                      <span className="text-xs text-gray-400 ml-2">{yaku.reading}</span>
                    </div>
                    <div className="text-xs text-right">
                      <span className="text-yellow-400 font-bold">{yaku.han}翻</span>
                      {yaku.hanOpen > 0 && (
                        <span className="text-gray-500 ml-1">(鳴き{yaku.hanOpen}翻)</span>
                      )}
                      {yaku.hanOpen === -1 && (
                        <span className="text-red-400/60 ml-1">(門前のみ)</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <h2 className="text-lg font-bold text-red-400 mt-6 mb-3">役満</h2>
              <div className="space-y-1">
                {yakumanYaku.map(([key, yaku]) => (
                  <div key={key} className="flex justify-between items-center py-1.5 border-b border-gray-700/50">
                    <div>
                      <span className="text-sm text-white">{yaku.name}</span>
                      <span className="text-xs text-gray-400 ml-2">{yaku.reading}</span>
                    </div>
                    <span className="text-xs text-red-400 font-bold">役満</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowYakuList(false)}
              className="w-full py-2.5 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium
                transition-all mb-4"
            >
              チュートリアルに戻る
            </button>
          </>
        )}

        <button
          onClick={() => navigate('/')}
          className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-lg font-bold
            transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          メニューに戻る
        </button>
      </div>
    </div>
  );
};
