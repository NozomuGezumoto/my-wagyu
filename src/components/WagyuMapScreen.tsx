// ============================================
// 全国ブランド牛制覇 - 地図画面
// 日本地図に都道府県ピン、記録がある県は金枠
// ============================================

import React, { useMemo, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Modal,
  useWindowDimensions,
} from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  JAPAN_INITIAL_REGION,
  SPACING,
  RADIUS,
  WAGYU_COLORS,
  WAGYU_SHADOWS,
} from '../constants/theme';
import {
  PREFECTURE_PIN_COORDS,
  getPrefectureProgressMap,
  getPinStateFromRatio,
} from '../data/wagyuData';
import { getWagyuRatingsWithContent } from '../data/wagyuRatingStorage';
import { usePrefectureToWagyu } from '../hooks/useWagyuForList';
import WagyuPatternBackground from './WagyuPatternBackground';
import WagyuPrefecturePin from './WagyuPrefecturePin';

const MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#222222' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#737373' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#252525' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#525252' }] },
];

export default function WagyuMapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const calloutMaxWidth = Math.min(screenWidth - 48, 450);
  const layoutPadding = screenWidth <= 375 ? 14 : SPACING.lg;
  const prefectureToWagyu = usePrefectureToWagyu();
  const pins = useMemo(() => {
    return Array.from(prefectureToWagyu.entries())
      .map(([pref, brandList]) => {
        const coords = PREFECTURE_PIN_COORDS[pref];
        if (!coords || !brandList.length) return null;
        return {
          prefecture: pref,
          brandList: brandList.map((name) => ({ name })),
          latitude: coords[0],
          longitude: coords[1],
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);
  }, [prefectureToWagyu]);

  const [calloutPicker, setCalloutPicker] = useState<{
    prefecture: string;
    brandList: { name: string }[];
  } | null>(null);

  const [recordKeys, setRecordKeys] = useState<Set<string>>(new Set());
  const loadRecordKeys = useCallback(async () => {
    const list = await getWagyuRatingsWithContent();
    setRecordKeys(new Set(list.map((e) => `${e.prefecture}|${e.wagyuName}`)));
  }, []);
  useFocusEffect(
    useCallback(() => {
      loadRecordKeys();
    }, [loadRecordKeys])
  );

  const nationwideAchievement = useMemo(() => {
    const total = pins.reduce((sum, p) => sum + p.brandList.length, 0);
    const achieved = pins.reduce(
      (sum, p) =>
        sum + p.brandList.filter(({ name }) => recordKeys.has(`${p.prefecture}|${name}`)).length,
      0
    );
    return { achieved, total };
  }, [pins, recordKeys]);

  const progressMap = useMemo(
    () => getPrefectureProgressMap(recordKeys, prefectureToWagyu),
    [recordKeys, prefectureToWagyu]
  );

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={JAPAN_INITIAL_REGION}
        customMapStyle={MAP_STYLE}
        showsUserLocation={false}
        showsMyLocationButton={false}
      >
        {pins.map(({ prefecture, brandList, latitude, longitude }) => {
          const progress = progressMap[prefecture];
          const state = progress ? getPinStateFromRatio(progress.ratio) : 'S0';
          return (
            <Marker
              key={prefecture}
              coordinate={{ latitude, longitude }}
              anchor={{ x: 0.5, y: 0.5 }}
              onCalloutPress={() => setCalloutPicker({ prefecture, brandList })}
            >
              <WagyuPrefecturePin
                state={state}
                size={state === 'S3' ? 's3' : 'default'}
              />
              <Callout
                tooltip
                onPress={() => setCalloutPicker({ prefecture, brandList })}
              >
                <View style={[styles.callout, { maxWidth: calloutMaxWidth }]}>
                  <Text style={styles.calloutTitle} numberOfLines={1}>
                    {prefecture}
                  </Text>
                  {(() => {
                    const achieved = brandList.filter(({ name }) =>
                      recordKeys.has(`${prefecture}|${name}`)
                    ).length;
                    const total = brandList.length;
                    return (
                      <View style={styles.calloutAchievementRow}>
                        <Text style={styles.calloutAchievementText}>
                          達成度 {achieved}/{total} 品目
                        </Text>
                        <View style={styles.calloutAchievementBarBg}>
                          <View
                            style={[
                              styles.calloutAchievementBarFill,
                              {
                                width: total ? `${(achieved / total) * 100}%` : '0%',
                              },
                            ]}
                          />
                        </View>
                      </View>
                    );
                  })()}
                  {brandList.map(({ name }, i) => {
                    const achieved = recordKeys.has(`${prefecture}|${name}`);
                    return (
                      <View key={i} style={styles.calloutRow}>
                        <Text style={styles.calloutName} numberOfLines={2}>
                          {name}
                        </Text>
                        <View style={styles.calloutRight}>
                          {achieved && (
                            <View style={styles.calloutAchievedBadge}>
                              <Ionicons
                                name="checkmark-circle"
                                size={14}
                                color={WAGYU_COLORS.success}
                              />
                              <Text style={styles.calloutAchievedText}>達成</Text>
                            </View>
                          )}
                          <Ionicons
                            name="chevron-forward"
                            size={14}
                            color={WAGYU_COLORS.textMuted}
                            style={styles.calloutChevron}
                          />
                        </View>
                      </View>
                    );
                  })}
                  <Text style={styles.calloutHint}>吹き出しをタップで詳細・写真・評価へ</Text>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      <WagyuPatternBackground
        pattern="stripes"
        style={[
          styles.header,
          {
            paddingTop: insets.top + SPACING.md,
            paddingBottom: SPACING.lg,
            paddingHorizontal: layoutPadding,
          },
        ]}
      >
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>全国ブランド牛制覇</Text>
          <Text style={styles.headerSubtitle}>全国のブランド牛銘柄</Text>
          <View style={styles.headerAchievementRow}>
            <Text style={styles.headerAchievementLabel}>全国 達成度</Text>
            <Text style={styles.headerAchievementValue}>
              {nationwideAchievement.achieved} / {nationwideAchievement.total} 品目
            </Text>
            <View style={styles.headerAchievementBarBg}>
              <View
                style={[
                  styles.headerAchievementBarFill,
                  {
                    width:
                      nationwideAchievement.total
                        ? `${(nationwideAchievement.achieved / nationwideAchievement.total) * 100}%`
                        : '0%',
                  },
                ]}
              />
            </View>
          </View>
        </View>
      </WagyuPatternBackground>

      <Pressable
        style={[styles.listButton, { bottom: insets.bottom + 24 }]}
        onPress={() => router.push('/(tabs)/list')}
      >
        <Ionicons name="list" size={22} color="#fff" />
        <Text style={styles.listButtonText}>ブランド牛一覧</Text>
      </Pressable>

      <Modal
        visible={calloutPicker != null}
        transparent
        animationType="fade"
        onRequestClose={() => setCalloutPicker(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setCalloutPicker(null)}>
          <Pressable style={styles.modalContent} onPress={() => {}}>
            {calloutPicker && (
              <>
                <Text style={styles.modalTitle}>{calloutPicker.prefecture}の代表牛</Text>
                <Text style={styles.modalSubtitle}>タップして写真・評価へ</Text>
                {(() => {
                  const pref = calloutPicker.prefecture;
                  const list = calloutPicker.brandList;
                  const achieved = list.filter(({ name }) =>
                    recordKeys.has(`${pref}|${name}`)
                  ).length;
                  const total = list.length;
                  return (
                    <View style={styles.modalAchievementRow}>
                      <Text style={styles.modalAchievementLabel}>達成度</Text>
                      <Text style={styles.modalAchievementValue}>
                        {achieved} / {total} 品目
                      </Text>
                      <View style={styles.modalAchievementBarBg}>
                        <View
                          style={[
                            styles.modalAchievementBarFill,
                            {
                              width: total ? `${(achieved / total) * 100}%` : '0%',
                            },
                          ]}
                        />
                      </View>
                    </View>
                  );
                })()}
                {calloutPicker.brandList.map(({ name }, i) => {
                  const achieved = recordKeys.has(
                    `${calloutPicker.prefecture}|${name}`
                  );
                  return (
                    <Pressable
                      key={i}
                      style={styles.modalRow}
                      onPress={() => {
                        setCalloutPicker(null);
                        router.push({
                          pathname: '/(tabs)/wagyu-detail',
                          params: {
                            wagyuName: name,
                            prefectures: JSON.stringify([calloutPicker.prefecture]),
                          },
                        });
                      }}
                    >
                      <Text style={styles.modalRowName} numberOfLines={1}>
                        {name}
                      </Text>
                      <View style={styles.modalRowRight}>
                        {achieved && (
                          <View style={styles.modalRowAchieved}>
                            <Ionicons
                              name="checkmark-circle"
                              size={18}
                              color={WAGYU_COLORS.success}
                            />
                            <Text style={styles.modalRowAchievedText}>達成</Text>
                          </View>
                        )}
                        <Ionicons
                          name="chevron-forward"
                          size={18}
                          color={WAGYU_COLORS.textMuted}
                        />
                      </View>
                    </Pressable>
                  );
                })}
                <Pressable style={styles.modalClose} onPress={() => setCalloutPicker(null)}>
                  <Text style={styles.modalCloseText}>閉じる</Text>
                </Pressable>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WAGYU_COLORS.backgroundElevated,
    borderBottomWidth: 1,
    borderBottomColor: WAGYU_COLORS.borderLight,
    ...WAGYU_SHADOWS.header,
  },
  headerText: {
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: 0.2,
    color: WAGYU_COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: WAGYU_COLORS.textMuted,
    marginTop: 4,
    letterSpacing: 0.2,
  },
  headerAchievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  headerAchievementLabel: {
    fontSize: 11,
    color: WAGYU_COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerAchievementValue: {
    fontSize: 13,
    fontWeight: '700',
    color: WAGYU_COLORS.accent,
  },
  headerAchievementBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: WAGYU_COLORS.surface,
    borderRadius: 3,
    overflow: 'hidden',
  },
  headerAchievementBarFill: {
    height: '100%',
    backgroundColor: WAGYU_COLORS.accent,
    borderRadius: 3,
  },
  callout: {
    minWidth: 240,
    maxWidth: 450,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    backgroundColor: WAGYU_COLORS.backgroundElevated,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: WAGYU_COLORS.borderLight,
    ...WAGYU_SHADOWS.card,
  },
  calloutTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
    color: WAGYU_COLORS.textPrimary,
    marginBottom: 8,
  },
  calloutAchievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  calloutAchievementText: {
    fontSize: 11,
    color: WAGYU_COLORS.textMuted,
  },
  calloutAchievementBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: WAGYU_COLORS.surface,
    borderRadius: 2,
    overflow: 'hidden',
  },
  calloutAchievementBarFill: {
    height: '100%',
    backgroundColor: WAGYU_COLORS.accent,
    borderRadius: 2,
  },
  calloutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 2,
    borderRadius: RADIUS.sm,
    minHeight: 28,
  },
  calloutRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    minWidth: 0,
    maxWidth: '50%',
  },
  calloutChevron: {
    marginLeft: 2,
    flexShrink: 0,
  },
  calloutName: {
    fontSize: 13,
    fontWeight: '600',
    color: WAGYU_COLORS.textPrimary,
    flex: 1,
    minWidth: 0,
  },
  calloutAchievedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  calloutAchievedText: {
    fontSize: 10,
    fontWeight: '600',
    color: WAGYU_COLORS.success,
  },
  calloutHint: {
    fontSize: 10,
    color: WAGYU_COLORS.textMuted,
    marginTop: 10,
    marginBottom: 4,
  },
  listButton: {
    position: 'absolute',
    right: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    backgroundColor: WAGYU_COLORS.accent,
    borderRadius: RADIUS.full,
    ...WAGYU_SHADOWS.cardStrong,
  },
  listButtonText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: '#0a0a0a',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  modalContent: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: WAGYU_COLORS.backgroundElevated,
    borderRadius: 16,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: WAGYU_COLORS.borderLight,
    ...WAGYU_SHADOWS.cardStrong,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: 0.2,
    color: WAGYU_COLORS.textPrimary,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: WAGYU_COLORS.textMuted,
    marginBottom: SPACING.sm,
  },
  modalAchievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  modalAchievementLabel: {
    fontSize: 12,
    color: WAGYU_COLORS.textMuted,
  },
  modalAchievementValue: {
    fontSize: 13,
    fontWeight: '700',
    color: WAGYU_COLORS.textPrimary,
  },
  modalAchievementBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: WAGYU_COLORS.surface,
    borderRadius: 3,
    overflow: 'hidden',
  },
  modalAchievementBarFill: {
    height: '100%',
    backgroundColor: WAGYU_COLORS.accent,
    borderRadius: 3,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: WAGYU_COLORS.border,
  },
  modalRowName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: WAGYU_COLORS.textPrimary,
    marginRight: SPACING.sm,
  },
  modalRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  modalRowAchieved: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: WAGYU_COLORS.surface,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  modalRowAchievedText: {
    fontSize: 11,
    fontWeight: '600',
    color: WAGYU_COLORS.success,
  },
  modalClose: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
    color: WAGYU_COLORS.accent,
  },
});
