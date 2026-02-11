import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

type HelpSection = 'controls' | 'flow' | 'glossary' | 'faq';

const SECTIONS: { id: HelpSection; label: string }[] = [
  { id: 'controls', label: '操作方法' },
  { id: 'flow', label: 'ゲームの流れ' },
  { id: 'glossary', label: '用語集' },
  { id: 'faq', label: 'FAQ' },
];

export const HelpPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<HelpSection>('controls');

  return (
    <div className="min-h-screen flex items-center justify-center theme-gradient">
      <div className="theme-bg-card rounded-2xl p-6 sm:p-8 max-w-lg w-full mx-4 text-white max-h-[90vh] flex flex-col">
        <h1 className="text-3xl font-bold text-center mb-4 theme-text-accent">ヘルプ</h1>

        {/* タブ */}
        <div className="flex gap-1 mb-4 bg-gray-800/50 rounded-lg p-1">
          {SECTIONS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={`flex-1 py-2 rounded-md text-xs sm:text-sm font-medium transition-all
                ${activeSection === id
                  ? 'bg-yellow-500 text-black'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* コンテンツ */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {activeSection === 'controls' && <ControlsSection />}
          {activeSection === 'flow' && <FlowSection />}
          {activeSection === 'glossary' && <GlossarySection />}
          {activeSection === 'faq' && <FaqSection />}
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={() => navigate('/yaku')}
            className="flex-1 py-3 bg-green-700 hover:bg-green-600 rounded-xl text-sm font-bold
              transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            役一覧を見る
          </button>
          <button
            onClick={() => navigate(-1)}
            className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-sm font-bold
              transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            戻る
          </button>
        </div>
      </div>
    </div>
  );
};

// ========== 操作方法 ==========
const ControlsSection: React.FC = () => (
  <div className="space-y-4">
    <HelpCard title="牌の選択と打牌">
      <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
        <li>手牌をクリックして選択（黄色枠で表示）</li>
        <li>選択中にもう一度クリック、またはダブルクリックで打牌</li>
        <li>「打牌」ボタン（左下）でも打牌できます</li>
        <li>ドラッグ&ドロップでも打牌可能</li>
      </ul>
    </HelpCard>

    <HelpCard title="キーボードショートカット">
      <div className="grid grid-cols-2 gap-1 text-sm text-gray-300">
        <span className="text-yellow-400">1-9, 0</span><span>手牌を番号で選択</span>
        <span className="text-yellow-400">← →</span><span>手牌の選択を移動</span>
        <span className="text-yellow-400">Enter / Space</span><span>打牌</span>
        <span className="text-yellow-400">R</span><span>リーチ</span>
        <span className="text-yellow-400">T</span><span>ツモ和了</span>
        <span className="text-yellow-400">O</span><span>ロン</span>
        <span className="text-yellow-400">P</span><span>ポン</span>
        <span className="text-yellow-400">C</span><span>チー</span>
        <span className="text-yellow-400">K</span><span>カン</span>
        <span className="text-yellow-400">S</span><span>スキップ</span>
        <span className="text-yellow-400">Esc</span><span>選択解除</span>
      </div>
    </HelpCard>

    <HelpCard title="画面の見方">
      <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
        <li>画面下部: あなたの手牌</li>
        <li>画面上部: 対面の捨て牌・副露</li>
        <li>画面左右: 左右プレイヤーの捨て牌・副露</li>
        <li>画面中央: 局情報（風・残り枚数・スコア・ドラ表示）</li>
        <li>ステータスバー: 現在の状態（あなたの番／相手の番など）</li>
      </ul>
    </HelpCard>

    <HelpCard title="アクションボタン">
      <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
        <li><span className="text-red-400 font-bold">ツモ</span>: ツモ和了（自分のツモで和了）</li>
        <li><span className="text-red-400 font-bold">ロン</span>: ロン和了（他家の捨て牌で和了）</li>
        <li><span className="text-yellow-400 font-bold">リーチ</span>: リーチ宣言</li>
        <li><span className="text-orange-400 font-bold">ポン</span>: 同じ牌3枚で鳴き</li>
        <li><span className="text-orange-400 font-bold">チー</span>: 順子で鳴き（上家のみ）</li>
        <li><span className="text-orange-400 font-bold">カン</span>: 同じ牌4枚で槓</li>
        <li><span className="text-gray-400 font-bold">スキップ</span>: 鳴きを見送る</li>
      </ul>
    </HelpCard>
  </div>
);

// ========== ゲームの流れ ==========
const FlowSection: React.FC = () => (
  <div className="space-y-4">
    <HelpCard title="1局の流れ">
      <div className="space-y-3 text-sm text-gray-300">
        <FlowStep step="1" title="配牌">各プレイヤーに13枚の牌を配ります。</FlowStep>
        <FlowStep step="2" title="ツモ">親から順番に山から1枚ツモります（合計14枚）。</FlowStep>
        <FlowStep step="3" title="打牌">14枚から1枚選んで捨てます。</FlowStep>
        <FlowStep step="4" title="鳴き判断">他のプレイヤーが捨て牌に対してポン・チー・カン・ロンを宣言できます。</FlowStep>
        <FlowStep step="5" title="繰り返し">2-4を繰り返します。</FlowStep>
        <FlowStep step="6" title="和了/流局">
          誰かが和了するか、山がなくなると局が終了します。
        </FlowStep>
      </div>
    </HelpCard>

    <HelpCard title="勝利条件">
      <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
        <li>4面子1雀頭（4つのグループ＋1ペア）を完成させる</li>
        <li>特殊形: 七対子（7ペア）、国士無双（13種の么九牌＋1）</li>
        <li>和了には「役」が1つ以上必要</li>
      </ul>
    </HelpCard>

    <HelpCard title="半荘戦の進行">
      <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
        <li>東1局 → 東2局 → 東3局 → 東4局</li>
        <li>南1局 → 南2局 → 南3局 → 南4局</li>
        <li>合計8局（親は各プレイヤーが2回ずつ）</li>
        <li>最終的にスコアが最も高いプレイヤーが勝利</li>
      </ul>
    </HelpCard>
  </div>
);

// ========== 用語集 ==========
const GlossarySection: React.FC = () => (
  <div className="space-y-2">
    {[
      { term: 'ツモ', desc: '山から牌を1枚引くこと。また、自分のツモで和了すること。' },
      { term: 'ロン', desc: '他家の捨て牌で和了すること。' },
      { term: 'リーチ', desc: '門前（鳴きなし）で聴牌した時に宣言できる。1000点を供託し、1翻追加。' },
      { term: 'ポン', desc: '他家の捨て牌と手牌の2枚で刻子（同じ牌3枚）を作る。' },
      { term: 'チー', desc: '上家（左のプレイヤー）の捨て牌と手牌の2枚で順子（連番3枚）を作る。' },
      { term: 'カン', desc: '同じ牌4枚を使って槓子を作る。新しいドラが増える。' },
      { term: '面子（メンツ）', desc: '3枚1組のグループ。刻子（同じ3枚）または順子（連番3枚）。' },
      { term: '雀頭（ジャントウ）', desc: '同じ牌2枚のペア。和了に1組必要。' },
      { term: '門前（メンゼン）', desc: 'ポン・チー・明槓をしていない状態。リーチやツモの条件。' },
      { term: '聴牌（テンパイ）', desc: 'あと1枚で和了できる状態。' },
      { term: '向聴数（シャンテンスウ）', desc: '聴牌までに必要な牌の交換回数。0=聴牌、1=一向聴。' },
      { term: 'フリテン', desc: '自分の捨て牌にある牌ではロンできない状態。ツモ和了は可能。' },
      { term: 'ドラ', desc: 'ドラ表示牌の次の牌がドラ。持っているだけで1翻追加。' },
      { term: '翻（ハン）', desc: '役の強さの単位。翻が多いほど高得点。' },
      { term: '符（フ）', desc: '手牌の構成で決まる得点計算の基礎単位。' },
      { term: '役満（ヤクマン）', desc: '最高難度の役。通常の得点計算を超える固定点数。' },
      { term: '赤ドラ', desc: '各スートの5に1枚ずつある赤い牌。ドラとして1翻。' },
      { term: '喰いタン', desc: '鳴いた状態でのタンヤオ（断么九）。ルールにより有無が変わる。' },
      { term: '本場（ホンバ）', desc: '連荘やノーテン流局のカウント。1本場ごとに300点追加。' },
    ].map(({ term, desc }) => (
      <div key={term} className="bg-gray-800/50 rounded-lg px-3 py-2">
        <span className="text-yellow-400 font-bold text-sm">{term}</span>
        <p className="text-gray-300 text-xs mt-0.5">{desc}</p>
      </div>
    ))}
  </div>
);

// ========== FAQ ==========
const FaqSection: React.FC = () => (
  <div className="space-y-3">
    {[
      {
        q: '和了できません。なぜですか？',
        a: '和了には「役」が1つ以上必要です。牌を揃えるだけでは和了できません。リーチ、タンヤオ、役牌などの役を狙いましょう。役一覧画面で確認できます。',
      },
      {
        q: 'ロンボタンが出ないのですが？',
        a: 'フリテン状態ではロンできません。自分の捨て牌に待ち牌がある場合はフリテンです。ツモ和了は可能です。',
      },
      {
        q: 'チーボタンが出ないのですが？',
        a: 'チーは上家（左のプレイヤー）の捨て牌に対してのみ可能です。対面や下家からはチーできません。',
      },
      {
        q: 'リーチの条件は？',
        a: '門前（ポン・チーしていない）で聴牌（あと1枚で和了）の状態で、1000点以上持っている場合にリーチ宣言できます。',
      },
      {
        q: 'ドラの見方が分かりません',
        a: 'ドラ表示牌の「次の牌」がドラです。例: ドラ表示が2萬なら3萬がドラ。9なら1がドラ。字牌は東→南→西→北→東、白→發→中→白の順。',
      },
      {
        q: 'CPU戦でCPUの強さを変えられますか？',
        a: 'メニュー画面の「CPU強さ」または設定画面の「AI難易度」で初級・中級・上級を選べます。',
      },
      {
        q: 'オフラインでプレイできますか？',
        a: 'CPU対戦モードはオフラインでプレイ可能です。PWAとしてインストールすればホーム画面からアクセスできます。',
      },
    ].map(({ q, a }, i) => (
      <div key={i} className="bg-gray-800/50 rounded-lg px-4 py-3">
        <p className="text-yellow-400 font-bold text-sm">Q: {q}</p>
        <p className="text-gray-300 text-xs mt-1">A: {a}</p>
      </div>
    ))}
  </div>
);

// ========== 共通コンポーネント ==========
const HelpCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-gray-800/50 rounded-lg p-4">
    <h3 className="text-yellow-400 font-bold text-base mb-2">{title}</h3>
    {children}
  </div>
);

const FlowStep: React.FC<{ step: string; title: string; children: React.ReactNode }> = ({ step, title, children }) => (
  <div className="flex gap-3 items-start">
    <div className="w-6 h-6 bg-yellow-500 text-black rounded-full flex items-center justify-center text-xs font-bold shrink-0">
      {step}
    </div>
    <div>
      <span className="font-bold text-white">{title}</span>
      <p className="text-gray-400 text-xs mt-0.5">{children}</p>
    </div>
  </div>
);
