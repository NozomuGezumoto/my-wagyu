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
 * 簡易な牛の頭シルエット（丸み＋耳）。
 * outline = 線のみ、filled = 塗り。
 */
export default function CowIcon({ variant, size, color }: CowIconProps) {
  const isOutline = variant === 'outline';
  const strokeWidth = isOutline ? 1.8 : 0;
  const fillColor = isOutline ? 'transparent' : color;
  const strokeColor = isOutline ? color : 'transparent';

  const path =
    'M12 2.5 L8 5 Q5 6 5 10 Q5 15 12 19 Q19 15 19 10 Q19 6 16 5 L12 2.5 Z';

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
