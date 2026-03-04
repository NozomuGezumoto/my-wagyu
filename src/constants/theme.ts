// ============================================
// My Sushi - Theme Configuration
// Modern Japanese-inspired palette
// ============================================

export const SUSHI_COLORS = {
  // Primary - 藍色 (Indigo) - 落ち着いた日本的な色
  primary: '#3b5998',
  primaryLight: '#5a7fc2',
  primaryDark: '#2d4373',

  // Accent colors
  accent: '#e85d75',          // 桜色 (Sakura pink) - 行きたい
  accentSecondary: '#2d9d78', // 若竹色 (Bamboo green) - 行った
  accentTertiary: '#f0a500',  // 山吹色 (Yamabuki gold)
  
  // Backgrounds - クリーンで落ち着いた白
  background: '#f8f9fa',
  backgroundElevated: '#ffffff',
  backgroundCard: '#ffffff',

  // Surface - ほんのり暖かみ
  surface: '#f1f3f4',
  surfaceLight: '#f8f9fa',
  surfaceDark: '#e8eaed',

  // Text - しっかりしたコントラスト
  textPrimary: '#202124',
  textSecondary: '#5f6368',
  textMuted: '#9aa0a6',

  // Semantic
  success: '#2d9d78',
  warning: '#f0a500',
  error: '#d93025',

  // Map
  mapOverlay: 'rgba(248, 249, 250, 0.95)',
  mapOverlayLight: 'rgba(248, 249, 250, 0.80)',

  // Pins
  sushiPin: '#3b5998',
  cluster: '#e85d75',

  // Borders
  border: 'rgba(0, 0, 0, 0.08)',
  borderLight: 'rgba(0, 0, 0, 0.04)',
};

// 全国ブランド牛制覇用 - ダーク×ゴールド（背景は重くない暗めのグレー）
export const WAGYU_COLORS = {
  primary: '#D4AF37',
  primaryLight: '#E5C76B',
  primaryDark: '#242424',
  accent: '#D4AF37',
  accentSecondary: '#B8860B',
  accentTertiary: '#E5C76B',
  background: '#1a1a1a',
  backgroundElevated: '#222222',
  surface: '#262626',
  surfaceLight: '#2e2e2e',
  textPrimary: '#fafafa',
  textSecondary: '#b5b5b5',
  textMuted: '#787878',
  success: '#22c55e',
  warning: '#D4AF37',
  error: '#ef4444',
  border: 'rgba(255, 255, 255, 0.06)',
  borderLight: 'rgba(255, 255, 255, 0.03)',
  pin: '#242424',
  pinGold: '#D4AF37',
  /** ピン内側（アイコン背景） */
  pinInner: '#1c1c1c',
  /** ピン内の星アイコン用（金よりやや明るいゴールドで差別化） */
  pinStar: '#E8C547',
  /** 地図ピン 4段階: S1 ブロンズ枠 */
  pinBronze: '#B08D57',
  /** 地図ピン 4段階: S2 シルバー枠（落ち着いた銀） */
  pinSilver: '#A8A8A8',
  /** 地図ピン 白枠（S0 未達成） */
  pinWhite: '#f0f0f0',
};

/** ダークテーマ用シャドウ（控えめで洗練） */
export const WAGYU_SHADOWS = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 6,
  },
  cardStrong: {
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 10,
  },
  header: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },
};

export const TOKYO_CENTER = {
  latitude: 35.6762,
  longitude: 139.6503,
};

export const TOKYO_INITIAL_REGION = {
  latitude: 35.6762,
  longitude: 139.6503,
  latitudeDelta: 0.15,
  longitudeDelta: 0.15,
};

// Japan-wide view (centered roughly on Honshu)
export const JAPAN_CENTER = {
  latitude: 36.5,
  longitude: 138.0,
};

export const JAPAN_INITIAL_REGION = {
  latitude: 36.5,
  longitude: 138.0,
  latitudeDelta: 12.0,  // Show most of Japan
  longitudeDelta: 12.0,
};

export const PIN_SIZE = {
  marker: 44,
  markerS3: 46,
  cluster: 48,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  full: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
};
