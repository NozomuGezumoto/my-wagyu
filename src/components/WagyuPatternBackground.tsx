// ============================================
// 高級感のある斜線柄・ドット柄（View のみで実装）
// ============================================

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

const STRIPE_SPACING = 40;
const STRIPE_WIDTH = 1.5;
const STRIPE_LENGTH = 600;
const DOT_SPACING = 32;
const DOT_SIZE = 1;

// テーマの金 #D4AF37 と同じ RGB（斜線・ドットでなじむよう opacity で調整）
const GOLD_RGB = '212, 175, 55';

type PatternType = 'stripes' | 'dots';

interface WagyuPatternBackgroundProps {
  children?: React.ReactNode;
  pattern?: PatternType;
  opacity?: number;
  style?: ViewStyle;
}

/** 斜線2本のみ。左から30%の位置を基準に -45deg で引く（透明度高め） */
function StripesPattern({
  opacity = 0.06,
  width,
}: {
  opacity?: number;
  width: number;
}) {
  if (width <= 0) return null;
  const baseX = width * 1;
  const leftOrigin = baseX - STRIPE_LENGTH / 2;
  const lines = [
    { left: leftOrigin, top: -80 },
    { left: leftOrigin + STRIPE_SPACING, top: -80 },
  ];
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {lines.map((pos, i) => (
        <View
          key={i}
          style={[
            styles.stripe,
            {
              left: pos.left,
              top: pos.top,
              width: STRIPE_LENGTH,
              backgroundColor: `rgba(${GOLD_RGB}, ${opacity})`,
            },
          ]}
        />
      ))}
    </View>
  );
}

/** ドット柄 - テーマの金で小さい点（透明度高め） */
function DotsPattern({ opacity = 0.02 }: { opacity?: number }) {
  const rows = 12;
  const cols = 14;
  const dots: { row: number; col: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      dots.push({ row: r, col: c });
    }
  }
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {dots.map(({ row, col }, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            {
              top: row * DOT_SPACING,
              left: col * DOT_SPACING,
              backgroundColor: `rgba(${GOLD_RGB}, ${opacity})`,
              borderRadius: DOT_SIZE,
              width: DOT_SIZE * 2,
              height: DOT_SIZE * 2,
            },
          ]}
        />
      ))}
    </View>
  );
}

export default function WagyuPatternBackground({
  children,
  pattern = 'stripes',
  opacity,
  style,
}: WagyuPatternBackgroundProps) {
  const [layoutWidth, setLayoutWidth] = useState(0);
  const onLayout = useCallback(
    (e: { nativeEvent: { layout: { width: number } } }) => {
      setLayoutWidth(e.nativeEvent.layout.width);
    },
    []
  );
  const defaultOpacity = pattern === 'stripes' ? 0.06 : 0.02;
  const o = opacity ?? defaultOpacity;

  return (
    <View style={[styles.container, style]} onLayout={onLayout}>
      {pattern === 'stripes' ? (
        <StripesPattern opacity={o} width={layoutWidth} />
      ) : (
        <DotsPattern opacity={o} />
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  stripe: {
    position: 'absolute',
    height: STRIPE_WIDTH,
    transform: [{ rotate: '-45deg' }],
  },
  dot: {
    position: 'absolute',
  },
});
