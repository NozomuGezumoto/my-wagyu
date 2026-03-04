// ============================================
// Layout - iPhone 画面サイズ対応
// ============================================

import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// iPhone 代表幅 (pt): SE 375, 14/15 390, Plus/Max 430
export const LAYOUT = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  /** コンテンツ用の横パディング（小さい機種でやや詰める） */
  horizontalPadding: SCREEN_WIDTH <= 375 ? 14 : 16,
  /** フッター固定時の下余白（SafeArea 込みは各画面で insets.bottom を足す） */
  footerPaddingBottom: 24,
  /** リスト末尾の余白（フッター高さ＋余裕） */
  listBottomPaddingWithFooter: 120,
} as const;

export function getLayout() {
  const { width, height } = Dimensions.get('window');
  return {
    width,
    height,
    horizontalPadding: width <= 375 ? 14 : 16,
  };
}
