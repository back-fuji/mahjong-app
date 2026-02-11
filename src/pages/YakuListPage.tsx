import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { YAKU_DEFINITIONS } from '../core/types/yaku.ts';
import type { YakuId } from '../core/types/yaku.ts';

type TabId = 'yaku' | 'fu' | 'score' | 'rules';

const TABS: { id: TabId; label: string }[] = [
  { id: 'yaku', label: '役一覧' },
  { id: 'fu', label: '符計算' },
  { id: 'score', label: '得点表' },
  { id: 'rules', label: '特殊ルール' },
];

export const YakuListPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('yaku');

  return (
    <div className="min-h-screen flex items-center justify-center theme-gradient">
      <div className="theme-bg-card rounded-2xl p-6 sm:p-8 max-w-2xl w-full mx-4 text-white max-h-[90vh] flex flex-col">
        <h1 className="text-3xl font-bold text-center mb-4 theme-text-accent">役一覧・ルール</h1>

        {/* タブ */}
        <div className="flex gap-1 mb-4 bg-gray-800/50 rounded-lg p-1">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 py-2 rounded-md text-xs sm:text-sm font-medium transition-all
                ${activeTab === id
                  ? 'bg-yellow-500 text-black'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* コンテンツ */}
        <div className="flex-1 overflow-y-auto pr-1">
          {activeTab === 'yaku' && <YakuListTab />}
          {activeTab === 'fu' && <FuCalcTab />}
          {activeTab === 'score' && <ScoreTableTab />}
          {activeTab === 'rules' && <SpecialRulesTab />}
        </div>

        <button
          onClick={() => navigate(-1)}
          className="w-full mt-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-lg font-bold
            transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          戻る
        </button>
      </div>
    </div>
  );
};

// ========== 役一覧タブ ==========
const YakuListTab: React.FC = () => {
  const [search, setSearch] = useState('');
  const [hanFilter, setHanFilter] = useState<number | null>(null);

  const yakuEntries = useMemo(() => {
    const entries = Object.entries(YAKU_DEFINITIONS) as [YakuId, typeof YAKU_DEFINITIONS[YakuId]][];
    return entries.filter(([, def]) => {
      if (search && !def.name.includes(search) && !def.reading.includes(search.toUpperCase())) {
        return false;
      }
      if (hanFilter !== null) {
        if (hanFilter === 13) return def.isYakuman;
        return def.han === hanFilter && !def.isYakuman;
      }
      return true;
    });
  }, [search, hanFilter]);

  // 翻数グループ
  const groups = useMemo(() => {
    const map = new Map<string, typeof yakuEntries>();
    for (const entry of yakuEntries) {
      const [, def] = entry;
      let key: string;
      if (def.isYakuman) {
        key = def.han >= 26 ? 'ダブル役満' : '役満';
      } else {
        key = `${def.han}翻`;
      }
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(entry);
    }
    return map;
  }, [yakuEntries]);

  return (
    <div className="space-y-4">
      {/* 検索・フィルター */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="役名で検索..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-gray-800/70 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500
            border border-gray-700 focus:border-yellow-500 focus:outline-none"
        />
      </div>
      <div className="flex flex-wrap gap-1">
        <FilterBtn active={hanFilter === null} onClick={() => setHanFilter(null)}>全て</FilterBtn>
        <FilterBtn active={hanFilter === 1} onClick={() => setHanFilter(1)}>1翻</FilterBtn>
        <FilterBtn active={hanFilter === 2} onClick={() => setHanFilter(2)}>2翻</FilterBtn>
        <FilterBtn active={hanFilter === 3} onClick={() => setHanFilter(3)}>3翻</FilterBtn>
        <FilterBtn active={hanFilter === 6} onClick={() => setHanFilter(6)}>6翻</FilterBtn>
        <FilterBtn active={hanFilter === 13} onClick={() => setHanFilter(13)}>役満</FilterBtn>
      </div>

      {/* 役一覧 */}
      {[...groups.entries()].map(([groupName, entries]) => (
        <div key={groupName}>
          <h3 className="text-yellow-400 font-bold text-base mb-2 border-b border-yellow-400/30 pb-1">
            {groupName}
          </h3>
          <div className="space-y-2">
            {entries.map(([id, def]) => (
              <div key={id} className="bg-gray-800/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm">{def.name}</span>
                  <div className="flex gap-2 text-xs">
                    <span className="text-yellow-400">
                      {def.isYakuman
                        ? (def.han >= 26 ? 'ダブル役満' : '役満')
                        : `${def.han}翻`}
                    </span>
                    {!def.isYakuman && (
                      <span className="text-gray-500">
                        {def.hanOpen === -1
                          ? '(門前限定)'
                          : def.hanOpen < def.han
                            ? `(食い下がり${def.hanOpen}翻)`
                            : '(鳴きOK)'}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-gray-400 text-xs">{def.description}</p>
                <p className="text-gray-500 text-[10px] mt-1">条件: {def.condition}</p>
              </div>
            ))}
          </div>
        </div>
      ))}

      {yakuEntries.length === 0 && (
        <p className="text-center text-gray-500 py-8">該当する役が見つかりません</p>
      )}
    </div>
  );
};

// ========== 符計算タブ ==========
const FuCalcTab: React.FC = () => (
  <div className="space-y-4">
    <div className="bg-gray-800/50 rounded-lg p-4">
      <h3 className="text-yellow-400 font-bold mb-2">基本符</h3>
      <table className="w-full text-sm">
        <tbody className="divide-y divide-gray-700">
          <FuRow label="副底（基本点）" value="20符" />
          <FuRow label="門前ロン加符" value="+10符" />
          <FuRow label="ツモ" value="+2符" />
        </tbody>
      </table>
    </div>

    <div className="bg-gray-800/50 rounded-lg p-4">
      <h3 className="text-yellow-400 font-bold mb-2">面子</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-500 text-xs">
            <th className="text-left py-1">種類</th>
            <th className="text-center">中張牌</th>
            <th className="text-center">么九牌</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          <tr>
            <td className="py-1 text-gray-300">明刻（ポン）</td>
            <td className="text-center text-yellow-400">2符</td>
            <td className="text-center text-yellow-400">4符</td>
          </tr>
          <tr>
            <td className="py-1 text-gray-300">暗刻</td>
            <td className="text-center text-yellow-400">4符</td>
            <td className="text-center text-yellow-400">8符</td>
          </tr>
          <tr>
            <td className="py-1 text-gray-300">明槓</td>
            <td className="text-center text-yellow-400">8符</td>
            <td className="text-center text-yellow-400">16符</td>
          </tr>
          <tr>
            <td className="py-1 text-gray-300">暗槓</td>
            <td className="text-center text-yellow-400">16符</td>
            <td className="text-center text-yellow-400">32符</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div className="bg-gray-800/50 rounded-lg p-4">
      <h3 className="text-yellow-400 font-bold mb-2">雀頭</h3>
      <table className="w-full text-sm">
        <tbody className="divide-y divide-gray-700">
          <FuRow label="役牌（三元牌/自風/場風）" value="+2符" />
          <FuRow label="連風牌（場風=自風）" value="+2符" />
          <FuRow label="それ以外" value="0符" />
        </tbody>
      </table>
    </div>

    <div className="bg-gray-800/50 rounded-lg p-4">
      <h3 className="text-yellow-400 font-bold mb-2">待ち</h3>
      <table className="w-full text-sm">
        <tbody className="divide-y divide-gray-700">
          <FuRow label="両面待ち（例: 34で25待ち）" value="0符" />
          <FuRow label="シャンポン待ち" value="0符" />
          <FuRow label="嵌張待ち（例: 35で4待ち）" value="+2符" />
          <FuRow label="辺張待ち（例: 12で3待ち）" value="+2符" />
          <FuRow label="単騎待ち" value="+2符" />
        </tbody>
      </table>
    </div>

    <div className="bg-gray-800/50 rounded-lg p-4 text-xs text-gray-400">
      <p>※ 計算結果は10の倍数に切り上げ</p>
      <p>※ 平和ツモは20符固定、食い平和は30符固定</p>
      <p>※ 七対子は25符固定</p>
    </div>
  </div>
);

// ========== 得点表タブ ==========
const ScoreTableTab: React.FC = () => (
  <div className="space-y-4">
    <div className="bg-gray-800/50 rounded-lg p-4">
      <h3 className="text-yellow-400 font-bold mb-2">子のロン</h3>
      <ScoreGrid isOya={false} isTsumo={false} />
    </div>

    <div className="bg-gray-800/50 rounded-lg p-4">
      <h3 className="text-yellow-400 font-bold mb-2">親のロン</h3>
      <ScoreGrid isOya={true} isTsumo={false} />
    </div>

    <div className="bg-gray-800/50 rounded-lg p-4">
      <h3 className="text-yellow-400 font-bold mb-2">子のツモ（親/子 の支払い）</h3>
      <ScoreGrid isOya={false} isTsumo={true} />
    </div>

    <div className="bg-gray-800/50 rounded-lg p-4">
      <h3 className="text-yellow-400 font-bold mb-2">親のツモ（各自の支払い）</h3>
      <ScoreGrid isOya={true} isTsumo={true} />
    </div>

    <div className="bg-gray-800/50 rounded-lg p-4">
      <h3 className="text-yellow-400 font-bold mb-2">特殊得点</h3>
      <table className="w-full text-sm">
        <tbody className="divide-y divide-gray-700">
          <FuRow label="満貫 (5翻)" value="子8000 / 親12000" />
          <FuRow label="跳満 (6-7翻)" value="子12000 / 親18000" />
          <FuRow label="倍満 (8-10翻)" value="子16000 / 親24000" />
          <FuRow label="三倍満 (11-12翻)" value="子24000 / 親36000" />
          <FuRow label="数え役満 (13翻以上)" value="子32000 / 親48000" />
          <FuRow label="役満" value="子32000 / 親48000" />
          <FuRow label="ダブル役満" value="子64000 / 親96000" />
        </tbody>
      </table>
    </div>
  </div>
);

// ========== 特殊ルールタブ ==========
const SpecialRulesTab: React.FC = () => (
  <div className="space-y-3">
    {[
      {
        title: 'フリテン',
        content: '自分の捨て牌にある牌ではロンできません。ただしツモ和了は可能です。また、ロンを見逃した場合は同巡内フリテンとなり、次の自分のツモまでロンできません。',
      },
      {
        title: '喰い替え禁止',
        content: '鳴いた直後に、鳴いた面子と同じ牌や、鳴いた面子を崩すような牌を捨てることはできません。例: 3を鳴いて1-2-3を作った後に3は捨てられない。',
      },
      {
        title: '流局（ノーテン流局）',
        content: '山がなくなった時、聴牌者と非聴牌者の間で点数のやり取りが行われます（ノーテン罰符3000点）。',
      },
      {
        title: '九種九牌',
        content: '第一ツモの時点で手牌に9種以上の么九牌がある場合、流局を宣言できます。',
      },
      {
        title: '四風子連打',
        content: '第一巡で4人全員が同じ風牌を捨てた場合、流局になります。',
      },
      {
        title: '四槓散了',
        content: '場に4回の槓が発生した時点で流局になります（同一プレイヤーの4回は四槓子）。',
      },
      {
        title: '四家立直',
        content: '4人全員がリーチを宣言した場合、流局になります。',
      },
      {
        title: '連荘',
        content: '親が和了、または聴牌で流局した場合、同じ親で次の局が始まります（本場が増加）。',
      },
      {
        title: '供託リーチ棒',
        content: 'リーチ宣言時に供託した1000点は、次に和了したプレイヤーが全て受け取ります。',
      },
    ].map(({ title, content }) => (
      <div key={title} className="bg-gray-800/50 rounded-lg p-3">
        <h4 className="text-yellow-400 font-bold text-sm mb-1">{title}</h4>
        <p className="text-gray-300 text-xs leading-relaxed">{content}</p>
      </div>
    ))}
  </div>
);

// ========== 共通コンポーネント ==========
const FilterBtn: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1 rounded-full text-xs font-medium transition-all
      ${active ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
  >
    {children}
  </button>
);

const FuRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <tr>
    <td className="py-1.5 text-gray-300 text-xs">{label}</td>
    <td className="py-1.5 text-yellow-400 text-right text-xs font-mono">{value}</td>
  </tr>
);

// ========== 得点表グリッド ==========
const ScoreGrid: React.FC<{ isOya: boolean; isTsumo: boolean }> = ({ isOya, isTsumo }) => {
  // 基本点テーブル（子ロン / 親ロン / 子ツモ / 親ツモ）
  const fuList = [20, 25, 30, 40, 50, 60, 70];
  const hanList = [1, 2, 3, 4];

  function calcScore(han: number, fu: number): string {
    // 特殊ケース
    if (fu === 25 && han < 2) return '-'; // 七対子は2翻以上
    if (fu === 20 && han === 1 && !isTsumo) return '-'; // 20符1翻ロンはない

    let base = fu * Math.pow(2, han + 2);
    if (base > 2000) base = 2000; // 満貫

    if (isOya) {
      if (isTsumo) {
        const each = Math.ceil((base * 2) / 100) * 100;
        return `${each}all`;
      } else {
        return `${Math.ceil((base * 6) / 100) * 100}`;
      }
    } else {
      if (isTsumo) {
        const ko = Math.ceil(base / 100) * 100;
        const oya = Math.ceil((base * 2) / 100) * 100;
        return `${ko}/${oya}`;
      } else {
        return `${Math.ceil((base * 4) / 100) * 100}`;
      }
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="text-left text-gray-500 py-1 pr-2">符＼翻</th>
            {hanList.map(h => (
              <th key={h} className="text-center text-gray-400 py-1 px-1">{h}翻</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700/50">
          {fuList.map(fu => (
            <tr key={fu}>
              <td className="py-1 text-gray-400 pr-2">{fu}符</td>
              {hanList.map(han => (
                <td key={han} className="text-center py-1 px-1 text-yellow-400 font-mono text-[10px]">
                  {calcScore(han, fu)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
