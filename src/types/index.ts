// Sushi shop data types (from OSM GeoJSON)

export interface SushiShop {
  osm_id: string;
  name: string;
  name_reading?: string;  // ひらがな/カタカナ読み（あれば）
  amenity: string;
  shop: string;
  cuisine: string;
  'addr:prefecture': string;
  'addr:city': string;
  'addr:full': string;
  source: string;
}

export interface SushiFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  properties: SushiShop;
}

export interface SushiGeoJSON {
  type: 'FeatureCollection';
  features: SushiFeature[];
}

// Map pin for display
export interface SushiPin {
  id: string;
  lat: number;
  lng: number;
  name: string;
  nameReading: string;  // ソート用（読み仮名があればそれ、なければname）
  type: 'restaurant' | 'fast_food' | 'seafood';
  cuisine: string;
  address: string;
  prefecture: string;   // 都道府県（フィルター用）
  isCustom?: boolean;   // ユーザーが追加した店舗
}

// 都道府県リスト
export const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県',
  '岐阜県', '静岡県', '愛知県', '三重県',
  '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県',
  '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県',
  '福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
] as const;

export type Prefecture = typeof PREFECTURES[number];

// ============================================
// Fish species: 名産地（都道府県）・旬（月）
// データ取得パイプライン（e-Stat / 旬カレンダー）の成果物用
// ============================================

/** 地域タグ（旬のソース分類）北/東/西/南 */
export type SeasonRegion = '北' | '東' | '西' | '南';

/** 魚種ごとの名産地（都道府県 Top3〜5） */
export interface FamousOrigin {
  /** 都道府県名の配列（数量順） */
  prefectures: string[];
  /** 集計年（例: 2023）または "2021-2023" のような範囲 */
  surveyYear: string;
  /** 出典: e-Stat 表名など */
  source: string;
  /** 出典URL（e-Stat ファイルページ等） */
  sourceUrl?: string;
}

/** 魚種ごとの旬（月 1〜12）、地域別 */
export interface SeasonByRegion {
  /** 月の配列（1〜12）。最頻＋前後1ヶ月など幅を持たせる場合あり */
  months: number[];
  /** 地域タグ */
  region: SeasonRegion;
  /** ソース名（自治体名・サイト名） */
  source: string;
  /** 出典URL */
  sourceUrl?: string;
}

/** 魚種マスタ（名産地・旬・名前正規化の統合結果） */
export interface FishSpecies {
  /** 基準名（e-Stat 表記を優先。アプリ表示用） */
  name: string;
  /** 名産地（都道府県 Top3〜5） */
  famousOrigin?: FamousOrigin;
  /** 地域別の旬。複数地域がある場合は配列 */
  season?: SeasonByRegion[];
  /** 一覧用の旬表示（パイプラインにない場合のフォールバック文言） */
  seasonDisplay?: string;
  /** 別名（旬カレンダー等の表記）。名前正規化でこの魚にマップされる */
  aliases?: string[];
}

/** 名産地・旬データの最終成果物（出典付き） */
export interface FishSeasonOriginData {
  /** 生成日時 ISO8601 */
  generatedAt: string;
  /** 魚種ごとのデータ */
  species: FishSpecies[];
  /** 出典一覧（アプリの出典表示用） */
  citations: {
    title: string;
    url?: string;
    description?: string;
  }[];
}

/** ユーザーが追加した魚介データ（ローカル保存） */
export interface UserAddedFish {
  /** 魚介名 */
  name: string;
  /** 名産地（都道府県） */
  prefectures?: string[];
  /** 旬の表示例（例: 春～夏、10月～2月、通年） */
  seasonDisplay?: string;
  /** 追加日時（一覧の並び・識別用） */
  addedAt?: string;
}

/** 県別・魚介ごとのユーザー登録（写真最大3枚・星5段階評価） */
export interface PrefectureFishPhotoRating {
  prefecture: string;
  fishName: string;
  /** 保存した写真のURI（最大3件） */
  photoUris: string[];
  /** 1〜5 の評価。未設定時は undefined */
  rating?: number;
  /** コメント（任意） */
  comment?: string;
}

// ============================================
// Wagyu (全国ブランド牛制覇)
// ============================================

/** ブランド牛マスタ（将来: 格付けタグ・複数ブランド対応） */
export interface WagyuBrand {
  /** ブランド名 */
  name: string;
  /** 都道府県（1県1代表の場合は1要素） */
  prefecture: string;
  /** 格付けメモ用（将来表示用。ユーザー入力は rating 側） */
  gradeTag?: string;
}

/** 県別・ブランド牛ごとのユーザー登録（写真最大4枚・星5・コメント・部位・格付けメモ） */
export interface PrefectureWagyuPhotoRating {
  prefecture: string;
  wagyuName: string;
  /** 保存した写真のURI（最大4枚） */
  photoUris: string[];
  /** 1〜5 の評価。未設定時は undefined */
  rating?: number;
  /** コメント（任意） */
  comment?: string;
  /** 部位メモ（任意） */
  cutMemo?: string;
  /** 格付けメモ（A5など、任意） */
  gradeMemo?: string;
}
