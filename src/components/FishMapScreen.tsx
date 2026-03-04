// ============================================
// Fish Map Screen - 日本地図で地域の名産魚を表示
// ピンをタップ → 下関ならふぐ、高知ならかつお など
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
  SUSHI_COLORS,
  SPACING,
  RADIUS,
  SHADOWS,
} from '../constants/theme';
import { PREFECTURE_PIN_COORDS, getFishSpeciesForList, isPremiumFish, getPinEmojiForRepresentative } from '../data/fishData';
import { getPhotoRatingsWithContent } from '../data/photoRatingStorage';
import { usePrefectureToFishWithSeason } from '../hooks/useFishSpeciesForList';

const MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#5f6368' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9d7e8' }] },
];

export default function FishMapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const calloutMaxWidth = Math.min(screenWidth - 48, 450);
  const { prefectureToFish, userAdded } = usePrefectureToFishWithSeason();
  const nameToPrefectureCount = useMemo(() => {
    const list = getFishSpeciesForList(userAdded);
    const map = new Map<string, number>();
    for (const s of list) {
      const n = s.famousOrigin?.prefectures?.length ?? 0;
      map.set(s.name, n);
    }
    return map;
  }, [userAdded]);
  const nameToPrefectures = useMemo(() => {
    const list = getFishSpeciesForList(userAdded);
    const map = new Map<string, string[]>();
    for (const s of list) {
      map.set(s.name, s.famousOrigin?.prefectures ?? []);
    }
    return map;
  }, [userAdded]);
  const pins = useMemo(() => {
    return Array.from(prefectureToFish.entries())
      .map(([pref, fishList]) => {
        const coords = PREFECTURE_PIN_COORDS[pref];
        if (!coords) return null;
        return { prefecture: pref, fishList, latitude: coords[0], longitude: coords[1] };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);
  }, [prefectureToFish]);

  const [calloutFishPicker, setCalloutFishPicker] = useState<{
    prefecture: string;
    fishList: { name: string; season: string }[];
  } | null>(null);

  const [recordKeys, setRecordKeys] = useState<Set<string>>(new Set());
  const loadRecordKeys = useCallback(async () => {
    const list = await getPhotoRatingsWithContent();
    setRecordKeys(new Set(list.map((e) => `${e.prefecture}|${e.fishName}`)));
  }, []);
  useFocusEffect(
    useCallback(() => {
      loadRecordKeys();
    }, [loadRecordKeys])
  );

  const nationwideAchievement = useMemo(() => {
    const total = pins.reduce((acc, p) => acc + p.fishList.length, 0);
    const achieved = pins.reduce(
      (acc, p) => acc + p.fishList.filter(({ name }) => recordKeys.has(`${p.prefecture}|${name}`)).length,
      0
    );
    return { achieved, total };
  }, [pins, recordKeys]);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={JAPAN_INITIAL_REGION}
        customMapStyle={MAP_STYLE}
        showsUserLocation={false}
        showsMyLocationButton={false}
      >
        {pins.map(({ prefecture, fishList, latitude, longitude }) => {
          const representativeName = fishList[0]?.name;
          const pinEmoji = getPinEmojiForRepresentative(representativeName ?? '');
          const hasRecord = fishList.some(({ name }) => recordKeys.has(`${prefecture}|${name}`));
          return (
          <Marker
            key={prefecture}
            coordinate={{ latitude, longitude }}
            anchor={{ x: 0.5, y: 0.5 }}
            onCalloutPress={() => setCalloutFishPicker({ prefecture, fishList })}
          >
            <View style={[styles.pin, hasRecord && styles.pinWithRecord]}>
              <Text style={styles.pinEmoji}>{pinEmoji}</Text>
            </View>
            <Callout
              tooltip
              onPress={() => setCalloutFishPicker({ prefecture, fishList })}
            >
              <View style={[styles.callout, { maxWidth: calloutMaxWidth }]}>
                <Text style={styles.calloutTitle} numberOfLines={1}>{prefecture}</Text>
                {(() => {
                  const achieved = fishList.filter(({ name }) => recordKeys.has(`${prefecture}|${name}`)).length;
                  const total = fishList.length;
                  return (
                    <View style={styles.calloutAchievementRow}>
                      <Text style={styles.calloutAchievementText}>達成度 {achieved}/{total} 品目</Text>
                      <View style={styles.calloutAchievementBarBg}>
                        <View style={[styles.calloutAchievementBarFill, { width: total ? `${(achieved / total) * 100}%` : '0%' }]} />
                      </View>
                    </View>
                  );
                })()}
                {(fishList.length > 6 ? fishList.slice(0, 5) : fishList).map(({ name, season }, i) => {
                  const prefectureCount = nameToPrefectureCount.get(name) ?? 0;
                  const showMeisan = prefectureCount >= 2;
                  const showPremium = isPremiumFish(name);
                  const rowContent = (
                    <>
                      <View style={styles.calloutNameBlock}>
                        <Text style={styles.calloutFishName} numberOfLines={2}>{name}</Text>
                        <View style={styles.calloutBadgeRow} pointerEvents="none">
                          {showMeisan && (
                            <View style={styles.calloutBadgeMeisan}>
                              <Text style={styles.calloutBadgeText}>名産</Text>
                            </View>
                          )}
                          {showPremium && (
                            <View style={styles.calloutBadgePremium}>
                              <Text style={styles.calloutBadgeText}>高級</Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <View style={styles.calloutRight}>
                        <Text style={styles.calloutSeason} numberOfLines={1}>旬: {season}</Text>
                        <Ionicons name="chevron-forward" size={14} color={SUSHI_COLORS.textMuted} style={styles.calloutChevron} />
                      </View>
                    </>
                  );
                  return (
                    <View key={i} style={styles.calloutRow}>
                      {rowContent}
                    </View>
                  );
                })}
                {fishList.length > 6 && (
                  <Text style={styles.calloutMore}>他{fishList.length - 5}件</Text>
                )}
                <Text style={styles.calloutHint}>吹き出しをタップで写真・評価へ</Text>
              </View>
            </Callout>
          </Marker>
          );
        })}
      </MapView>

      <View style={[styles.header, { paddingTop: insets.top + SPACING.md, paddingHorizontal: SPACING.lg }]}>
        <Text style={styles.headerTitle}>日本の魚介名産</Text>
        <Text style={styles.headerSubtitle}>都道府県別の名産</Text>
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
                  width: nationwideAchievement.total
                    ? `${(nationwideAchievement.achieved / nationwideAchievement.total) * 100}%`
                    : '0%',
                },
              ]}
            />
          </View>
        </View>
      </View>

      <Pressable
        style={[styles.listButton, { bottom: insets.bottom + 24 }]}
        onPress={() => router.push('/(tabs)/list')}
      >
        <Ionicons name="list" size={22} color="#fff" />
        <Text style={styles.listButtonText}>旬の魚一覧</Text>
      </Pressable>

      <Modal
        visible={calloutFishPicker != null}
        transparent
        animationType="fade"
        onRequestClose={() => setCalloutFishPicker(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setCalloutFishPicker(null)}>
          <Pressable style={styles.modalContent} onPress={() => {}}>
            {calloutFishPicker && (
              <>
                <Text style={styles.modalTitle}>{calloutFishPicker.prefecture}の名産</Text>
                <Text style={styles.modalSubtitle}>魚介をタップして写真・評価へ</Text>
                {(() => {
                  const pref = calloutFishPicker.prefecture;
                  const list = calloutFishPicker.fishList;
                  const achieved = list.filter(({ name }) => recordKeys.has(`${pref}|${name}`)).length;
                  const total = list.length;
                  return (
                    <View style={styles.modalAchievementRow}>
                      <Text style={styles.modalAchievementLabel}>達成度</Text>
                      <Text style={styles.modalAchievementValue}>{achieved} / {total} 品目</Text>
                      <View style={styles.modalAchievementBarBg}>
                        <View style={[styles.modalAchievementBarFill, { width: total ? `${(achieved / total) * 100}%` : '0%' }]} />
                      </View>
                    </View>
                  );
                })()}
                {calloutFishPicker.fishList.map(({ name }, i) => {
                  const prefectures = nameToPrefectures.get(name) ?? [];
                  const achieved = recordKeys.has(`${calloutFishPicker.prefecture}|${name}`);
                  return (
                    <Pressable
                      key={i}
                      style={styles.modalRow}
                      onPress={() => {
                        setCalloutFishPicker(null);
                        router.push({
                          pathname: '/(tabs)/fish-detail',
                          params: {
                            fishName: name,
                            prefectures: JSON.stringify(prefectures),
                          },
                        });
                      }}
                    >
                      <Text style={styles.modalRowName} numberOfLines={1}>{name}</Text>
                      <View style={styles.modalRowRight}>
                        {achieved && (
                          <View style={styles.modalRowAchieved}>
                            <Ionicons name="checkmark-circle" size={18} color={SUSHI_COLORS.success} />
                            <Text style={styles.modalRowAchievedText}>達成</Text>
                          </View>
                        )}
                        <Ionicons name="chevron-forward" size={18} color={SUSHI_COLORS.textMuted} />
                      </View>
                    </Pressable>
                  );
                })}
                <Pressable style={styles.modalClose} onPress={() => setCalloutFishPicker(null)}>
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
    paddingBottom: SPACING.md,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderBottomLeftRadius: RADIUS.lg,
    borderBottomRightRadius: RADIUS.lg,
    ...SHADOWS.md,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: SUSHI_COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: SUSHI_COLORS.textMuted,
    marginTop: 2,
  },
  headerAchievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  headerAchievementLabel: {
    fontSize: 11,
    color: SUSHI_COLORS.textMuted,
  },
  headerAchievementValue: {
    fontSize: 12,
    fontWeight: '700',
    color: SUSHI_COLORS.textPrimary,
  },
  headerAchievementBarBg: {
    flex: 1,
    height: 5,
    backgroundColor: SUSHI_COLORS.surface,
    borderRadius: 3,
    overflow: 'hidden',
  },
  headerAchievementBarFill: {
    height: '100%',
    backgroundColor: SUSHI_COLORS.success,
    borderRadius: 3,
  },
  pin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: SUSHI_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    ...SHADOWS.sm,
  },
  pinWithRecord: {
    borderColor: SUSHI_COLORS.accentTertiary,
    borderWidth: 3,
  },
  pinEmoji: {
    fontSize: 22,
  },
  callout: {
    minWidth: 240,
    maxWidth: 450,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.lg,
    backgroundColor: SUSHI_COLORS.backgroundElevated,
    borderRadius: RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SUSHI_COLORS.border,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: SUSHI_COLORS.textPrimary,
    marginBottom: 6,
  },
  calloutAchievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  calloutAchievementText: {
    fontSize: 11,
    color: SUSHI_COLORS.textMuted,
  },
  calloutAchievementBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: SUSHI_COLORS.surface,
    borderRadius: 2,
    overflow: 'hidden',
  },
  calloutAchievementBarFill: {
    height: '100%',
    backgroundColor: SUSHI_COLORS.success,
    borderRadius: 2,
  },
  calloutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  calloutHint: {
    fontSize: 10,
    color: SUSHI_COLORS.textMuted,
    marginTop: 10,
    marginBottom: 4,
  },
  calloutMore: {
    fontSize: 11,
    color: SUSHI_COLORS.textMuted,
    marginTop: 4,
  },
  calloutNameBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  calloutFishName: {
    fontSize: 13,
    fontWeight: '600',
    color: SUSHI_COLORS.textPrimary,
    flexShrink: 0,
    flex: 1,
    minWidth: 0,
  },
  calloutBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  calloutBadgeMeisan: {
    backgroundColor: SUSHI_COLORS.accentSecondary,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.sm,
  },
  calloutBadgePremium: {
    backgroundColor: SUSHI_COLORS.accentTertiary,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.sm,
  },
  calloutBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },
  calloutSeason: {
    fontSize: 12,
    color: SUSHI_COLORS.textSecondary,
    flexShrink: 1,
  },
  listButton: {
    position: 'absolute',
    right: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: SUSHI_COLORS.primary,
    borderRadius: RADIUS.full,
    ...SHADOWS.md,
  },
  listButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  modalContent: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: SUSHI_COLORS.backgroundElevated,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: SUSHI_COLORS.textPrimary,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 12,
    color: SUSHI_COLORS.textMuted,
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
    color: SUSHI_COLORS.textMuted,
  },
  modalAchievementValue: {
    fontSize: 13,
    fontWeight: '700',
    color: SUSHI_COLORS.textPrimary,
  },
  modalAchievementBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: SUSHI_COLORS.surface,
    borderRadius: 3,
    overflow: 'hidden',
  },
  modalAchievementBarFill: {
    height: '100%',
    backgroundColor: SUSHI_COLORS.success,
    borderRadius: 3,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: SUSHI_COLORS.border,
  },
  modalRowName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: SUSHI_COLORS.textPrimary,
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
    backgroundColor: SUSHI_COLORS.surface,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  modalRowAchievedText: {
    fontSize: 11,
    fontWeight: '600',
    color: SUSHI_COLORS.success,
  },
  modalClose: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 15,
    fontWeight: '600',
    color: SUSHI_COLORS.primary,
  },
});
