// ============================================
// Fish season / famous origin data loader
// Uses fish_season_origin.json from pipeline
// ============================================

import type { FishSeasonOriginData, FishSpecies, UserAddedFish } from '../types';

import data from './fish_season_origin.json';
import prefectureFish from './prefecture_fish.json';

const typedData = data as FishSeasonOriginData;
/** 47都道府県 × 魚介（同じ粒度のベース）。e-Stat で上書き可能 */
const PREFECTURE_FISH_BASE = prefectureFish as Record<string, string[]>;

export function getFishSeasonOriginData(): FishSeasonOriginData {
  return typedData;
}

/** 高級食材として扱う魚介（一覧で「高級」バッジ表示用） */
const PREMIUM_FISH_NAMES = new Set([
  'ノドグロ', 'キンキ', 'カンパチ', 'ボタンエビ', 'コハダ', 'シマアジ', 'カワハギ', 'ヒラマサ', 'ミル貝', 'トコブシ',
  'マグロ', 'ウニ', 'イクラ', 'アワビ', 'イセエビ', 'フグ', 'トラフグ', 'ヒラメ', 'マダイ', '甘エビ', 'タラバガニ',
  'ズワイガニ', '越前ガニ', '松葉ガニ', 'ホウボウ', 'ギンダラ', '毛ガニ', 'ホタテ', 'サザエ', '赤貝', 'クルマエビ',
  '伊勢エビ', 'カジキ', 'キス', 'カサゴ', 'メバル', 'アイナメ', 'サクラマス', '関アジ', '関サバ',
  '明太子', 'フグの子', '越前ウニ',
]);
export function isPremiumFish(name: string): boolean {
  return PREMIUM_FISH_NAMES.has(name);
}

/** 地図ピン用：代表名産の名前から絵文字を返す */
const SHELLFISH_NAMES = new Set([
  'ホタテ', 'カキ', 'アワビ', 'ハマグリ', 'サザエ', 'ミル貝', 'ホッキ貝', '赤貝', 'シジミ', '的矢カキ', 'トコブシ',
]);
const CRAB_NAMES = new Set([
  'タラバガニ', 'ズワイガニ', '越前ガニ', '松葉ガニ', '毛ガニ', 'リンゴガニ', 'ガザミ',
]);
const SHRIMP_NAMES = new Set([
  'イセエビ', '伊勢エビ', 'クルマエビ', '甘エビ', '桜エビ', 'シラエビ', 'ボタンエビ',
]);
const CEPHALOPOD_NAMES = new Set([
  'イカ', 'タコ', 'ホタルイカ', 'スルメイカ', 'アオリイカ',
]);
export function getPinEmojiForRepresentative(name: string): string {
  if (SHELLFISH_NAMES.has(name)) return '🦪';
  if (CRAB_NAMES.has(name)) return '🦀';
  if (SHRIMP_NAMES.has(name)) return '🦐';
  if (CEPHALOPOD_NAMES.has(name)) return '🦑';
  return '🐟';
}

export function getFishSpecies(): FishSpecies[] {
  return typedData?.species ?? [];
}

/** 一覧タブ用：prefecture_fish.json から魚ごとに名産地・旬を組み立てたリスト（地図と同じデータ源）。userAdded を渡すとマージする */
export function getFishSpeciesForList(userAdded: UserAddedFish[] = []): FishSpecies[] {
  const prefectureToNames = new Map<string, string[]>();
  for (const [pref, list] of Object.entries(PREFECTURE_FISH_BASE)) {
    prefectureToNames.set(pref, list ?? []);
  }
  // ユーザー追加分を名産地にマージ
  for (const u of userAdded) {
    for (const pref of u.prefectures ?? []) {
      const names = prefectureToNames.get(pref) ?? [];
      if (!names.includes(u.name)) names.push(u.name);
      prefectureToNames.set(pref, names);
    }
  }
  // 魚名 → 名産地リスト に逆引き
  const fishToPrefectures = new Map<string, string[]>();
  for (const [pref, names] of prefectureToNames) {
    for (const name of names) {
      const arr = fishToPrefectures.get(name) ?? [];
      if (!arr.includes(pref)) arr.push(pref);
      fishToPrefectures.set(name, arr);
    }
  }
  // パイプライン由来の名産地があればマージ
  const fromPipeline = getFishSpecies();
  for (const s of fromPipeline) {
    const prefs = s.famousOrigin?.prefectures ?? [];
    const arr = fishToPrefectures.get(s.name) ?? [];
    for (const p of prefs) {
      if (!arr.includes(p)) arr.push(p);
    }
    if (arr.length) fishToPrefectures.set(s.name, arr);
  }
  const nameToSpecies = new Map(fromPipeline.map(s => [s.name, s]));
  const fallbackSeasons: Record<string, string> = {
    'フグ': '10月～2月', 'カツオ': '春・秋', 'サケ': '9月～11月', 'ホッケ': '7月～10月', 'スケソウダラ': '冬',
    'ホタテ': '3月～6月', 'アジ': '春～夏', 'サバ': '秋', 'カキ': '冬', 'ホヤ': '夏', '伊勢エビ': '秋～冬',
    '真珠': '通年', 'マグロ': '秋～冬', 'サンマ': '秋', 'ブリ': '冬', 'マダイ': '春', 'タコ': '秋',
    'ウニ': '春～夏', 'タラバガニ': '冬', 'イクラ': '秋', 'ニシン': '春', 'コンブ': '夏', 'ワカメ': '春',
    'ハタハタ': '冬', 'サクラマス': '春～夏', 'ヒラメ': '冬～春', 'メヒカリ': '通年', 'カレイ': '冬',
    'アナゴ': '夏', 'ハマグリ': '春', 'ヤマメ': '夏', 'イワナ': '夏', 'ニジマス': '通年',
    'アユ': '夏', 'ウナギ': '夏', 'シラス': '春', '桜エビ': '春', 'ノリ': '冬', 'シャコ': '春',
    'ホタルイカ': '春', 'ズワイガニ': '冬', 'シラエビ': '春', '越前ガニ': '冬', '甘エビ': '冬', 'ワカサギ': '冬',
    'クルマエビ': '秋', 'アワビ': '夏', 'ハモ': '夏', 'イカナゴ': '春', '松葉ガニ': '冬', 'スズキ': '夏',
    'ハマチ': '秋～冬', '関アジ': '秋', '関サバ': '秋', 'イセエビ': '秋～冬', 'モズク': '春',
    'グルクン': '通年', 'イラブチャー': '夏', 'ミーバイ': '夏',
    'ノドグロ': '秋～冬', 'キンキ': '冬～春', 'カンパチ': '夏～秋', 'ボタンエビ': '春～秋', 'コハダ': '夏',
    'シマアジ': '夏～秋', 'カワハギ': '冬', 'ヒラマサ': '夏～秋', 'ミル貝': '春～夏', 'トコブシ': '春～夏',
    'スルメイカ': '夏～秋', 'アオリイカ': '春～夏', 'サザエ': '春～夏', '赤貝': '冬～春', 'ホッキ貝': '春～夏',
    'カジキ': '夏～秋', 'キス': '夏', 'カサゴ': '冬～春', 'メバル': '春', 'タラ': '冬', 'ヒジキ': '春',
    '毛ガニ': '秋～冬', 'ギンダラ': '冬～春', 'アイナメ': '秋～冬', 'ホウボウ': '冬～春', 'トラフグ': '冬',
    'ガザミ': '夏', 'イカ': '秋',
    '明太子': '通年', 'タラコ': '冬', '数の子': '冬', 'フカヒレ': '通年', '笹かまぼこ': '通年',
    'なめろう': '夏', 'くさや': '通年', 'トビウオ': '春', 'イカの塩辛': '秋～冬', 'かまぼこ': '通年',
    '越前ウニ': '夏', 'かつお節': '通年', 'あんこう': '冬', '的矢カキ': '冬',
    'くぎ煮': '春', 'ままかり': '秋', 'フグの子': '冬', 'ちりめん': '春', 'あご': '春', 'さつま揚げ': '通年', '海ぶどう': '通年',
  };
  const result: FishSpecies[] = [];
  const seen = new Set<string>();
  const userSeasonByFish = new Map<string, string>();
  for (const u of userAdded) {
    if (u.seasonDisplay?.trim()) userSeasonByFish.set(u.name.trim(), u.seasonDisplay.trim());
  }
  for (const [name, prefectures] of fishToPrefectures) {
    if (seen.has(name)) continue;
    seen.add(name);
    const fromPipe = nameToSpecies.get(name);
    let season = fallbackSeasons[name] ?? '—';
    let seasonByRegion = fromPipe?.season;
    if (fromPipe?.season?.length) {
      const texts = fromPipe.season.map(reg => formatSeasonMonths(reg.months)).filter(Boolean);
      if (texts.length) season = texts[0];
    }
    if (userSeasonByFish.has(name)) season = userSeasonByFish.get(name)!;
    result.push({
      name,
      famousOrigin: {
        prefectures,
        surveyYear: '—',
        source: '都道府県別名産魚介（アプリ内データ）',
      },
      season: seasonByRegion,
      seasonDisplay: season !== '—' ? season : undefined,
      aliases: fromPipe?.aliases,
    });
  }
  return result.sort((a, b) => (a.name < b.name ? -1 : 1));
}

const MONTH_NAMES = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

/** 季節フィルタ用: 春=3-5, 夏=6-8, 秋=9-11, 冬=12-2 */
export const SEASON_FILTER_OPTIONS: { key: string; label: string; months: number[] }[] = [
  { key: '', label: 'すべて', months: [] },
  { key: 'spring', label: '春', months: [3, 4, 5] },
  { key: 'summer', label: '夏', months: [6, 7, 8] },
  { key: 'autumn', label: '秋', months: [9, 10, 11] },
  { key: 'winter', label: '冬', months: [12, 1, 2] },
];

/** 旬表示文字列から月の配列を推定（1〜12）。パースできない場合は空配列 */
function parseSeasonDisplayToMonths(display: string): number[] {
  if (!display || display === '—') return [];
  const s = display.trim();
  if (s === '通年') return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const set = new Set<number>();
  const addSpring = () => { [3, 4, 5].forEach(m => set.add(m)); };
  const addSummer = () => { [6, 7, 8].forEach(m => set.add(m)); };
  const addAutumn = () => { [9, 10, 11].forEach(m => set.add(m)); };
  const addWinter = () => { [12, 1, 2].forEach(m => set.add(m)); };
  if (/春/.test(s)) addSpring();
  if (/夏/.test(s)) addSummer();
  if (/秋/.test(s)) addAutumn();
  if (/冬/.test(s)) addWinter();
  const monthRange = s.match(/(\d{1,2})月\s*[～\-]\s*(\d{1,2})月/);
  if (monthRange) {
    let a = parseInt(monthRange[1], 10);
    let b = parseInt(monthRange[2], 10);
    if (a >= 1 && a <= 12 && b >= 1 && b <= 12) {
      if (a <= b) for (let m = a; m <= b; m++) set.add(m);
      else { for (let m = a; m <= 12; m++) set.add(m); for (let m = 1; m <= b; m++) set.add(m); }
    }
  }
  const monthDots = s.matchAll(/(\d{1,2})月/g);
  for (const m of monthDots) {
    const n = parseInt(m[1], 10);
    if (n >= 1 && n <= 12) set.add(n);
  }
  return [...set].sort((x, y) => x - y);
}

/** 魚種が旬の月のリスト（1〜12）。フィルタ用 */
export function getMonthsInSeasonForSpecies(species: FishSpecies): number[] {
  if (species.season?.length) {
    const months = new Set<number>();
    for (const r of species.season) for (const m of r.months ?? []) if (m >= 1 && m <= 12) months.add(m);
    return [...months].sort((a, b) => a - b);
  }
  if (species.seasonDisplay) return parseSeasonDisplayToMonths(species.seasonDisplay);
  return [];
}

/** 指定月リストと旬月が1つでも重なれば true */
export function isInSeasonForMonths(species: FishSpecies, filterMonths: number[]): boolean {
  if (!filterMonths.length) return true;
  const fishMonths = new Set(getMonthsInSeasonForSpecies(species));
  return filterMonths.some(m => fishMonths.has(m));
}

/** 旬の月配列を「1月・3月・5月」のような文字列に */
export function formatSeasonMonths(months: number[]): string {
  if (!months?.length) return '—';
  return [...new Set(months)].sort((a, b) => a - b).map(m => MONTH_NAMES[m - 1]).join('・');
}

/** 名産地の都道府県を「北海道、宮城県、長崎県」のような文字列に */
export function formatFamousPrefectures(prefectures: string[]): string {
  if (!prefectures?.length) return '—';
  return prefectures.join('、');
}

// 都道府県の代表点（ピン表示用）[lat, lng]
export const PREFECTURE_PIN_COORDS: Record<string, [number, number]> = {
  '北海道': [43.4, 142.4], '青森県': [40.8, 140.7], '岩手県': [39.7, 141.1], '宮城県': [38.3, 140.9],
  '秋田県': [39.7, 140.1], '山形県': [38.2, 140.4], '福島県': [37.4, 140.5], '茨城県': [36.3, 140.4],
  '栃木県': [36.6, 139.9], '群馬県': [36.4, 139.0], '埼玉県': [35.9, 139.4], '千葉県': [35.6, 140.1],
  '東京都': [35.7, 139.7], '神奈川県': [35.4, 139.6], '新潟県': [37.9, 139.0], '富山県': [36.7, 137.2],
  '石川県': [36.6, 136.6], '福井県': [35.8, 136.2], '山梨県': [35.7, 138.7], '長野県': [36.1, 137.9],
  '岐阜県': [35.4, 136.8], '静岡県': [35.0, 138.4], '愛知県': [35.0, 137.2], '三重県': [34.7, 136.5],
  '滋賀県': [35.0, 136.2], '京都府': [35.0, 135.8], '大阪府': [34.7, 135.5], '兵庫県': [34.7, 135.1],
  '奈良県': [34.7, 135.8], '和歌山県': [33.7, 135.5], '鳥取県': [35.5, 134.2], '島根県': [35.5, 132.5],
  '岡山県': [34.7, 133.9], '広島県': [34.4, 132.5], '山口県': [34.2, 131.6], '徳島県': [34.1, 134.6],
  '香川県': [34.3, 134.0], '愛媛県': [33.8, 132.8], '高知県': [33.6, 133.5], '福岡県': [33.6, 130.4],
  '佐賀県': [33.2, 130.3], '長崎県': [33.2, 129.7], '熊本県': [32.8, 130.7], '大分県': [33.2, 131.6],
  '宮崎県': [32.0, 131.4], '鹿児島県': [31.6, 130.6], '沖縄県': [26.2, 127.7],
};

/** 名産地データから 都道府県 → 魚名リスト を生成。userAdded を渡すとマージする */
export function getPrefectureToFishList(userAdded: UserAddedFish[] = []): Map<string, string[]> {
  const map = new Map<string, string[]>();
  // 1) ベース: 47都道府県の魚介（同じ粒度）
  for (const [pref, list] of Object.entries(PREFECTURE_FISH_BASE)) {
    map.set(pref, [...(list || [])]);
  }
  // 2) パイプライン（e-Stat）由来の名産地があれば追加（重複除く）
  const species = getFishSpecies();
  for (const s of species) {
    const prefs = s.famousOrigin?.prefectures ?? [];
    for (const p of prefs) {
      const current = map.get(p) ?? [];
      if (!current.includes(s.name)) {
        current.push(s.name);
        map.set(p, current);
      }
    }
  }
  // 3) ユーザー追加分
  for (const u of userAdded) {
    for (const pref of u.prefectures ?? []) {
      const current = map.get(pref) ?? [];
      if (!current.includes(u.name)) {
        current.push(u.name);
        map.set(pref, current);
      }
    }
  }
  return map;
}

/** 都道府県 → 魚名＋旬のリスト（地図の吹き出し用） */
export interface FishWithSeason {
  name: string;
  season: string;
}

export function getPrefectureToFishWithSeason(userAdded: UserAddedFish[] = []): Map<string, FishWithSeason[]> {
  const speciesList = getFishSpecies();
  const nameToSpecies = new Map(speciesList.map(s => [s.name, s]));
  const userSeasonMap = new Map<string, string>();
  for (const u of userAdded) {
    if (u.seasonDisplay?.trim()) userSeasonMap.set(u.name.trim(), u.seasonDisplay.trim());
  }
  const fallbackSeasons: Record<string, string> = {
    'フグ': '10月～2月', 'カツオ': '春・秋', 'サケ': '9月～11月', 'ホッケ': '7月～10月', 'スケソウダラ': '冬',
    'ホタテ': '3月～6月', 'アジ': '春～夏', 'サバ': '秋', 'カキ': '冬', 'ホヤ': '夏', '伊勢エビ': '秋～冬',
    '真珠': '通年', 'マグロ': '秋～冬', 'サンマ': '秋', 'ブリ': '冬', 'マダイ': '春', 'タコ': '秋',
    'ウニ': '春～夏', 'タラバガニ': '冬', 'イクラ': '秋', 'ニシン': '春', 'コンブ': '夏', 'ワカメ': '春',
    'ハタハタ': '冬', 'サクラマス': '春～夏', 'ヒラメ': '冬～春', 'メヒカリ': '通年', 'カレイ': '冬',
    'アナゴ': '夏', 'ハマグリ': '春', 'ヤマメ': '夏', 'イワナ': '夏', 'ニジマス': '通年',
    'アユ': '夏', 'ウナギ': '夏', 'シラス': '春', '桜エビ': '春', 'ノリ': '冬', 'シャコ': '春',
    'ホタルイカ': '春', 'ズワイガニ': '冬', 'シラエビ': '春', '越前ガニ': '冬', '甘エビ': '冬',
    'ワカサギ': '冬', 'クルマエビ': '秋', 'アワビ': '夏', 'ハモ': '夏', 'イカナゴ': '春',
    '松葉ガニ': '冬', 'スズキ': '夏', 'ハマチ': '秋～冬', '関アジ': '秋', '関サバ': '秋',
    'イセエビ': '秋～冬', 'モズク': '春', 'グルクン': '通年', 'イラブチャー': '夏',
    'ノドグロ': '秋～冬', 'キンキ': '冬～春', 'カンパチ': '夏～秋', 'ボタンエビ': '春～秋', 'コハダ': '夏',
    'シマアジ': '夏～秋', 'カワハギ': '冬', 'ヒラマサ': '夏～秋', 'ミル貝': '春～夏', 'トコブシ': '春～夏',
    'スルメイカ': '夏～秋', 'アオリイカ': '春～夏', 'サザエ': '春～夏', '赤貝': '冬～春', 'ホッキ貝': '春～夏',
    'カジキ': '夏～秋', 'キス': '夏', 'カサゴ': '冬～春', 'メバル': '春', 'タラ': '冬', 'ヒジキ': '春',
    '毛ガニ': '秋～冬', 'ギンダラ': '冬～春', 'アイナメ': '秋～冬', 'ホウボウ': '冬～春', 'トラフグ': '冬',
    'ガザミ': '夏', 'イカ': '秋',
    '明太子': '通年', 'タラコ': '冬', '数の子': '冬', 'フカヒレ': '通年', '笹かまぼこ': '通年',
    'なめろう': '夏', 'くさや': '通年', 'トビウオ': '春', 'イカの塩辛': '秋～冬', 'かまぼこ': '通年',
    '越前ウニ': '夏', 'かつお節': '通年', 'あんこう': '冬', '的矢カキ': '冬',
    'くぎ煮': '春', 'ままかり': '秋', 'フグの子': '冬', 'ちりめん': '春', 'あご': '春', 'さつま揚げ': '通年', '海ぶどう': '通年',
  };
  const result = new Map<string, FishWithSeason[]>();
  const prefectureToNames = getPrefectureToFishList(userAdded);
  for (const [pref, names] of prefectureToNames.entries()) {
    const withSeason: FishWithSeason[] = names.map(name => {
      let season = userSeasonMap.get(name) ?? fallbackSeasons[name] ?? '—';
      const s = nameToSpecies.get(name);
      if (!userSeasonMap.has(name) && s?.season?.length) {
        const texts = s.season.map(reg => formatSeasonMonths(reg.months)).filter(Boolean);
        if (texts.length) season = texts[0];
      }
      return { name, season };
    });
    result.set(pref, withSeason);
  }
  return result;
}
