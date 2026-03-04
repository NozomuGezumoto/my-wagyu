// ============================================
// 魚介詳細 - 県別に写真（最大4枚・1枚大きく）と★5評価
// ============================================

import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  useWindowDimensions,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SUSHI_COLORS, SPACING, RADIUS } from '../constants/theme';
import type { PrefectureFishPhotoRating } from '../types';
import {
  getPhotoRatingsForFish,
  pickAndSavePhoto,
  addPhoto,
  removePhoto,
  setRating,
  setComment,
  MAX_PHOTOS,
} from '../data/photoRatingStorage';

function getPrefLabel(pref: string): string {
  if (pref === '北海道' || pref === '東京都') return pref === '東京都' ? '東京' : '北海道';
  if (pref === '大阪府' || pref === '京都府') return pref === '大阪府' ? '大阪' : '京都';
  return pref.replace(/県|府$/, '');
}

function isAchieved(data: PrefectureFishPhotoRating | null): boolean {
  if (!data) return false;
  return (
    data.photoUris.length > 0 ||
    (data.rating != null && data.rating >= 1) ||
    (data.comment != null && data.comment.trim() !== '')
  );
}

const STAR_COUNT = 5;

function PrefectureBlock({
  prefecture,
  fishName,
  data,
  onUpdate,
}: {
  prefecture: string;
  fishName: string;
  data: PrefectureFishPhotoRating | null;
  onUpdate: () => void | Promise<void>;
}) {
  const [adding, setAdding] = useState(false);
  const photoUris = data?.photoUris ?? [];
  const [displayRating, setDisplayRating] = useState(data?.rating ?? 0);
  useEffect(() => {
    setDisplayRating(data?.rating ?? 0);
  }, [data?.rating]);
  const [commentText, setCommentText] = useState(data?.comment ?? '');
  useEffect(() => {
    setCommentText(data?.comment ?? '');
  }, [data?.comment]);

  const handleAddPhoto = useCallback(async () => {
    if (photoUris.length >= MAX_PHOTOS) return;
    setAdding(true);
    try {
      const uri = await pickAndSavePhoto();
      if (uri) {
        await addPhoto(prefecture, fishName, uri);
        onUpdate();
      }
    } finally {
      setAdding(false);
    }
  }, [prefecture, fishName, photoUris.length, onUpdate]);

  const handleRemovePhoto = useCallback(
    (uri: string) => {
      Alert.alert('写真を削除', 'この写真を削除しますか？', [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            await removePhoto(prefecture, fishName, uri);
            await onUpdate();
          },
        },
      ]);
    },
    [prefecture, fishName, onUpdate]
  );

  const handleSetRating = useCallback(
    async (value: number) => {
      setDisplayRating(value);
      await setRating(prefecture, fishName, value);
      onUpdate();
    },
    [prefecture, fishName, onUpdate]
  );

  const handleSaveComment = useCallback(
    async () => {
      await setComment(prefecture, fishName, commentText);
      onUpdate();
    },
    [prefecture, fishName, commentText, onUpdate]
  );

  return (
    <View style={styles.block}>
      <View style={styles.blockTitleRow}>
        <Text style={styles.blockTitle}>{getPrefLabel(prefecture)}</Text>
        {isAchieved(data) && (
          <View style={styles.achievedBadge}>
            <Ionicons name="checkmark-circle" size={18} color={SUSHI_COLORS.success} />
            <Text style={styles.achievedBadgeText}>達成</Text>
          </View>
        )}
      </View>

      <Text style={styles.label}>写真（最大{MAX_PHOTOS}枚）</Text>
      {photoUris.length > 0 && (
        <View style={styles.photoLargeWrap}>
          <Image source={{ uri: photoUris[0] }} style={styles.photoLarge} resizeMode="cover" />
          <Pressable
            style={styles.photoDeleteHintLarge}
            onPress={() => handleRemovePhoto(photoUris[0])}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={18} color="#fff" />
          </Pressable>
        </View>
      )}
      <View style={styles.photoRow}>
        {photoUris.slice(1).map((uri) => (
          <View key={uri} style={styles.photoWrap}>
            <Image source={{ uri }} style={styles.photo} resizeMode="cover" />
            <Pressable
              style={styles.photoDeleteHint}
              onPress={() => handleRemovePhoto(uri)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="trash-outline" size={14} color="#fff" />
            </Pressable>
          </View>
        ))}
        {photoUris.length < MAX_PHOTOS && (
          <Pressable
            style={styles.photoAdd}
            onPress={handleAddPhoto}
            disabled={adding}
          >
            <Ionicons name="add" size={28} color={SUSHI_COLORS.primary} />
            <Text style={styles.photoAddText}>{adding ? '選択中…' : '追加'}</Text>
          </Pressable>
        )}
      </View>

      <Text style={[styles.label, { marginTop: SPACING.md }]}>評価（★5まで）</Text>
      <View style={styles.starRow}>
        {[1, 2, 3, 4, 5].map((value) => (
          <Pressable
            key={value}
            onPress={() => handleSetRating(value)}
            style={styles.starButton}
          >
            <Ionicons
              name={value <= displayRating ? 'star' : 'star-outline'}
              size={32}
              color={value <= displayRating ? SUSHI_COLORS.accentTertiary : SUSHI_COLORS.textMuted}
            />
          </Pressable>
        ))}
      </View>
      {displayRating > 0 && (
        <Text style={styles.ratingText}>{displayRating} / {STAR_COUNT}</Text>
      )}

      <Text style={[styles.label, { marginTop: SPACING.md }]}>コメント</Text>
      <TextInput
        style={styles.commentInput}
        value={commentText}
        onChangeText={setCommentText}
        onBlur={handleSaveComment}
        placeholder="メモや感想をどうぞ"
        placeholderTextColor={SUSHI_COLORS.textMuted}
        multiline
        numberOfLines={3}
      />
    </View>
  );
}

export default function FishDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ fishName: string; prefectures?: string }>();
  const fishName = params.fishName ?? '';
  const prefectures: string[] = params.prefectures
    ? (() => {
        try {
          const a = JSON.parse(params.prefectures) as string[];
          return Array.isArray(a) ? a : [];
        } catch {
          return [];
        }
      })()
    : [];

  const [dataMap, setDataMap] = useState<Map<string, PrefectureFishPhotoRating>>(new Map());

  const load = useCallback(async () => {
    if (!fishName || prefectures.length === 0) return;
    const map = await getPhotoRatingsForFish(fishName, prefectures);
    setDataMap(map);
  }, [fishName, prefectures]);

  useEffect(() => {
    load();
  }, [load]);

  const layoutPadding = width <= 375 ? 14 : SPACING.lg;

  if (!fishName) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={SUSHI_COLORS.textPrimary} />
        </Pressable>
        <Text style={styles.emptyTitle}>魚介を選択してください</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: SPACING.md + insets.top, paddingHorizontal: layoutPadding }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={SUSHI_COLORS.textPrimary} />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>{fishName}</Text>
        <Text style={styles.subtitle}>各県で写真・評価を登録（写真は3枚まで・★5）</Text>
        {prefectures.length > 0 && (() => {
          const achievedCount = prefectures.filter((pref) => isAchieved(dataMap.get(pref) ?? null)).length;
          const total = prefectures.length;
          return (
            <View style={styles.achievementRow}>
              <Text style={styles.achievementLabel}>全国 達成度</Text>
              <Text style={styles.achievementValue}>{achievedCount} / {total} 県</Text>
              <View style={[styles.achievementBarBg, { width: 120 }]}>
                <View style={[styles.achievementBarFill, { width: total ? (achievedCount / total) * 120 : 0 }]} />
              </View>
            </View>
          );
        })()}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: layoutPadding, paddingBottom: insets.bottom + SPACING.xl * 2 }]}
      >
        {prefectures.length === 0 ? (
          <Text style={styles.noPref}>名産地データがありません</Text>
        ) : (
          prefectures.map((pref) => (
            <PrefectureBlock
              key={pref}
              prefecture={pref}
              fishName={fishName}
              data={dataMap.get(pref) ?? null}
              onUpdate={load}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SUSHI_COLORS.background,
  },
  header: {
    backgroundColor: SUSHI_COLORS.backgroundElevated,
    paddingBottom: SPACING.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: SUSHI_COLORS.border,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: SUSHI_COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: SUSHI_COLORS.textMuted,
    marginTop: 4,
  },
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  achievementLabel: {
    fontSize: 12,
    color: SUSHI_COLORS.textMuted,
  },
  achievementValue: {
    fontSize: 13,
    fontWeight: '700',
    color: SUSHI_COLORS.textPrimary,
  },
  achievementBarBg: {
    height: 6,
    backgroundColor: SUSHI_COLORS.surface,
    borderRadius: 3,
    overflow: 'hidden',
  },
  achievementBarFill: {
    height: '100%',
    backgroundColor: SUSHI_COLORS.success,
    borderRadius: 3,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: SPACING.lg,
  },
  emptyTitle: {
    fontSize: 16,
    color: SUSHI_COLORS.textMuted,
    marginTop: SPACING.xl,
    marginLeft: SPACING.lg,
  },
  noPref: {
    fontSize: 14,
    color: SUSHI_COLORS.textMuted,
    marginTop: SPACING.lg,
  },
  block: {
    backgroundColor: SUSHI_COLORS.backgroundElevated,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SUSHI_COLORS.border,
  },
  blockTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  blockTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: SUSHI_COLORS.textPrimary,
  },
  achievedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: SUSHI_COLORS.surface,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  achievedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: SUSHI_COLORS.success,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: SUSHI_COLORS.textMuted,
    marginBottom: SPACING.xs,
  },
  photoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  photoLargeWrap: {
    width: '100%',
    aspectRatio: 4 / 3,
    maxHeight: 220,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    backgroundColor: SUSHI_COLORS.surface,
  },
  photoLarge: {
    width: '100%',
    height: '100%',
  },
  photoDeleteHintLarge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: RADIUS.sm,
    padding: 12,
  },
  photoWrap: {
    width: 88,
    height: 88,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    backgroundColor: SUSHI_COLORS.surface,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoDeleteHint: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: RADIUS.sm,
    padding: 10,
  },
  photoAdd: {
    width: 88,
    height: 88,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: SUSHI_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoAddText: {
    fontSize: 11,
    color: SUSHI_COLORS.primary,
    marginTop: 2,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    fontSize: 12,
    color: SUSHI_COLORS.textSecondary,
    marginTop: 4,
  },
  commentInput: {
    backgroundColor: SUSHI_COLORS.surface,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 14,
    color: SUSHI_COLORS.textPrimary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SUSHI_COLORS.border,
    minHeight: 72,
    textAlignVertical: 'top',
  },
});
