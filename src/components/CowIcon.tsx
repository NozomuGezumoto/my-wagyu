// ============================================
// 地図ピン用・牛アイコン（アウトライン / 塗り）
// ============================================

import React from 'react';
import Svg, { Path } from 'react-native-svg';

type CowIconVariant = 'outline' | 'filled';

interface CowIconProps {
  variant: CowIconVariant;
  size: number;
  color: string;
}

/**
 * 牛の頭シルエット（正面・丸顔＋両耳）。
 * outline = 線のみ、filled = 塗り。
 */
export default function CowIcon({ variant, size, color }: CowIconProps) {
  const isOutline = variant === 'outline';
  const strokeWidth = isOutline ? 1.5 : 0;
  const fillColor = isOutline ? 'transparent' : color;
  const strokeColor = isOutline ? color : 'transparent';

  // 牛の頭（丸い顔＋左右の耳）正面シルエット
  const path =
    'M12 2 C9 2 6 4 5 7 L4 6 Q3 5 4 4 Q5 4 6 5 L6 7 C5 10 4 14 4 16 C4 19 7 22 12 22 C17 22 20 19 20 16 C20 14 19 10 18 7 L18 5 Q19 4 20 4 Q21 5 20 6 L19 7 C18 4 15 2 12 2 Z';

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d={path}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
