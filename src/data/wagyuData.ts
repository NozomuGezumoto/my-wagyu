// ============================================
// 全国ブランド牛データ（47都道府県 × 代表1ブランド、将来複数対応）
// ============================================

import type { WagyuBrand } from '../types';
import prefectureWagyu from './prefecture_wagyu.json';
import wagyuDescriptionsData from './wagyu_descriptions.json';

const PREFECTURE_WAGYU_BASE = prefectureWagyu as Record<string, string[]>;
const wagyuDescriptions = wagyuDescriptionsData as Record<string, Record<string, string>>;

/** 指定した都道府県・銘柄の詳細説明を返す。なければ undefined */
export function getWagyuDescription(prefecture: string, wagyuName: string): string | undefined {
  const byPref = wagyuDescriptions[prefecture];
  if (!byPref) return undefined;
  return byPref[wagyuName];
}

/** 都道府県の代表点（ピン表示用）[lat, lng] */
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

/** 一覧用：全ブランド牛リスト（都道府県順） */
export function getWagyuBrandsForList(): WagyuBrand[] {
  const prefs = Object.keys(PREFECTURE_PIN_COORDS);
  const result: WagyuBrand[] = [];
  for (const pref of prefs) {
    const names = PREFECTURE_WAGYU_BASE[pref] ?? [];
    for (const name of names) {
      result.push({ name, prefecture: pref });
    }
  }
  return result.sort((a, b) => {
    const i = prefs.indexOf(a.prefecture);
    const j = prefs.indexOf(b.prefecture);
    if (i !== j) return i - j;
    return a.name.localeCompare(b.name);
  });
}

/** 都道府県 → ブランド名リスト（地図・モーダル用） */
export function getPrefectureToWagyuList(): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const [pref, list] of Object.entries(PREFECTURE_WAGYU_BASE)) {
    map.set(pref, [...(list ?? [])]);
  }
  return map;
}

/** 出典（一覧の出典開閉用。将来追加可能） */
export const WAGYU_CITATIONS: { title: string; url?: string; description?: string }[] = [
  { title: '各都道府県の代表ブランド牛（アプリ内データ）', description: '主要銘柄を1県1品目で掲載' },
];

/** 都道府県ごとの制覇進捗（地図ピン4段階用） */
export interface PrefectureProgress {
  done: number;
  total: number;
  ratio: number;
}

/**
 * 都道府県ごとの { done, total, ratio } を返す。
 * recordKeys: 達成済みの "都道府県|銘柄名" の Set。
 * prefectureToWagyuList: 都道府県 → 銘柄名[]。
 */
export function getPrefectureProgressMap(
  recordKeys: Set<string>,
  prefectureToWagyuList: Map<string, string[]>
): Record<string, PrefectureProgress> {
  const result: Record<string, PrefectureProgress> = {};
  for (const [prefecture, brandList] of prefectureToWagyuList.entries()) {
    const total = brandList.length;
    const done = brandList.filter((name) => recordKeys.has(`${prefecture}|${name}`)).length;
    result[prefecture] = {
      done,
      total,
      ratio: total > 0 ? done / total : 0,
    };
  }
  return result;
}

/** 進捗 ratio をピン状態 S0〜S3 に変換 */
export function getPinStateFromRatio(ratio: number): 'S0' | 'S1' | 'S2' | 'S3' {
  if (ratio <= 0) return 'S0';
  if (ratio < 0.5) return 'S1';
  if (ratio < 1) return 'S2';
  return 'S3';
}
