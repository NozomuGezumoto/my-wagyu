// ============================================
// 地図用・都道府県ピン（進捗4段階 S0〜S3）
// ============================================

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WAGYU_COLORS, PIN_SIZE, WAGYU_SHADOWS } from '../constants/theme';
import CowIcon from './CowIcon';

export type PinProgressState = 'S0' | 'S1' | 'S2' | 'S3';

interface WagyuPrefecturePinProps {
  state: PinProgressState;
  size?: 'default' | 's3';
  selected?: boolean;
}

const BORDER_WIDTH = 2.5;
const BORDER_WIDTH_S3 = 3.5;

export default function WagyuPrefecturePin({
  state,
  size = 'default',
  selected = false,
}: WagyuPrefecturePinProps) {
  const isS3 = state === 'S3';
  const pinSize = size === 's3' || isS3 ? PIN_SIZE.markerS3 : PIN_SIZE.marker;
  const borderW = isS3 ? BORDER_WIDTH_S3 : BORDER_WIDTH;
  const innerSize = pinSize - borderW * 2;

  const borderColor =
    state === 'S0'
      ? WAGYU_COLORS.pinWhite
      : state === 'S1'
        ? WAGYU_COLORS.pinBronze
        : state === 'S2'
          ? WAGYU_COLORS.pinSilver
          : WAGYU_COLORS.pinGold;

  const iconColor = WAGYU_COLORS.pinStar;
  const iconSize = innerSize * 0.6;

  return (
    <View
      style={[
        styles.outer,
        {
          width: pinSize,
          height: pinSize,
          borderRadius: pinSize / 2,
          borderWidth: borderW,
          borderColor,
          ...pinShadow,
        },
      ]}
    >
      <View
        style={[
          styles.inner,
          {
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
          },
        ]}
      >
        {state === 'S0' && (
          <CowIcon variant="outline" size={iconSize} color={iconColor} />
        )}
        {state === 'S1' && (
          <CowIcon variant="filled" size={iconSize} color={iconColor} />
        )}
        {state === 'S2' && (
          <View style={styles.s2Wrap}>
            <CowIcon variant="filled" size={iconSize * 0.8} color={iconColor} />
            <Ionicons
              name="star"
              size={iconSize * 0.35}
              color={WAGYU_COLORS.pinStar}
              style={styles.s2Star}
            />
          </View>
        )}
        {state === 'S3' && (
          <Ionicons
            name="trophy"
            size={iconSize}
            color={WAGYU_COLORS.pinStar}
          />
        )}
      </View>
    </View>
  );
}

const pinShadow = {
  ...WAGYU_SHADOWS.card,
};

const styles = StyleSheet.create({
  outer: {
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    backgroundColor: WAGYU_COLORS.pinInner,
    alignItems: 'center',
    justifyContent: 'center',
  },
  s2Wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  s2Star: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
});
