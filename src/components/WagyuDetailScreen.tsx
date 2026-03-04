// ============================================
// ブランド牛詳細 - 県ごとに写真（最大4枚）・星・コメント・部位メモ・格付けメモ
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
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WAGYU_COLORS, SPACING, RADIUS, WAGYU_SHADOWS } from '../constants/theme';
import type { PrefectureWagyuPhotoRating } from '../types';
import {
  getWagyuRatingsForBrand,
  pickAndSaveWagyuPhoto,
  addWagyuPhoto,
  removeWagyuPhoto,
  setWagyuRating,
  setWagyuComment,
  setWagyuCutMemo,
  setWagyuGradeMemo,
  MAX_PHOTOS,
} from '../data/wagyuRatingStorage';
import { getWagyuDescription } from '../data/wagyuData';
import WagyuPatternBackground from './WagyuPatternBackground';

function getPrefLabel(pref: string): string {
  if (pref === '北海道' || pref === '東京都') return pref === '東京都' ? '東京' : '北海道';
  if (pref === '大阪府' || pref === '京都府') return pref === '大阪府' ? '大阪' : '京都';
  return pref.replace(/県|府$/, '');
}

function isAchieved(data: PrefectureWagyuPhotoRating | null): boolean {
  if (!data) return false;
  return (
    data.photoUris.length > 0 ||
    (data.rating != null && data.rating >= 1) ||
    (data.comment != null && data.comment.trim() !== '') ||
    (data.cutMemo != null && data.cutMemo.trim() !== '') ||
    (data.gradeMemo != null && data.gradeMemo.trim() !== '')
  );
}

const STAR_COUNT = 5;

function PrefectureBlock({
  prefecture,
  wagyuName,
  data,
  onUpdate,
}: {
  prefecture: string;
  wagyuName: string;
  data: PrefectureWagyuPhotoRating | null;
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
  const [cutMemoText, setCutMemoText] = useState(data?.cutMemo ?? '');
  useEffect(() => {
    setCutMemoText(data?.cutMemo ?? '');
  }, [data?.cutMemo]);
  const [gradeMemoText, setGradeMemoText] = useState(data?.gradeMemo ?? '');
  useEffect(() => {
    setGradeMemoText(data?.gradeMemo ?? '');
  }, [data?.gradeMemo]);

  const handleAddPhoto = useCallback(async () => {
    if (photoUris.length >= MAX_PHOTOS) return;
    setAdding(true);
    try {
      const uri = await pickAndSaveWagyuPhoto();
      if (uri) {
        await addWagyuPhoto(prefecture, wagyuName, uri);
        onUpdate();
      }
    } finally {
      setAdding(false);
    }
  }, [prefecture, wagyuName, photoUris.length, onUpdate]);

  const handleRemovePhoto = useCallback(
    (uri: string) => {
      Alert.alert('写真を削除', 'この写真を削除しますか？', [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            await removeWagyuPhoto(prefecture, wagyuName, uri);
            await onUpdate();
          },
        },
      ]);
    },
    [prefecture, wagyuName, onUpdate]
  );

  const handleSetRating = useCallback(
    async (value: number) => {
      setDisplayRating(value);
      await setWagyuRating(prefecture, wagyuName, value);
      onUpdate();
    },
    [prefecture, wagyuName, onUpdate]
  );

  const handleSaveComment = useCallback(async () => {
    await setWagyuComment(prefecture, wagyuName, commentText);
    onUpdate();
  }, [prefecture, wagyuName, commentText, onUpdate]);

  const handleSaveCutMemo = useCallback(async () => {
    await setWagyuCutMemo(prefecture, wagyuName, cutMemoText);
    onUpdate();
  }, [prefecture, wagyuName, cutMemoText, onUpdate]);

  const handleSaveGradeMemo = useCallback(async () => {
    await setWagyuGradeMemo(prefecture, wagyuName, gradeMemoText);
    onUpdate();
  }, [prefecture, wagyuName, gradeMemoText, onUpdate]);

  const handleWebSearch = useCallback(() => {
    const query = `${prefecture} ${wagyuName}`;
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    Linking.openURL(url);
  }, [prefecture, wagyuName]);

  return (
    <WagyuPatternBackground pattern="dots" opacity={0.02} style={styles.block}>
      <View style={styles.blockTitleRow}>
        <Text style={styles.blockTitle}>{getPrefLabel(prefecture)}</Text>
        {isAchieved(data) && (
          <View style={styles.achievedBadge}>
            <Ionicons name="checkmark-circle" size={18} color={WAGYU_COLORS.success} />
            <Text style={styles.achievedBadgeText}>達成</Text>
          </View>
        )}
      </View>

      {(() => {
        const description = getWagyuDescription(prefecture, wagyuName);
        if (!description) return null;
        return (
          <View style={styles.blockDescriptionWrap}>
            <Text style={styles.blockDescriptionLabel}>この和牛について</Text>
            <Text style={styles.blockDescription}>{description}</Text>
          </View>
        );
      })()}

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
          <Pressable style={styles.photoAdd} onPress={handleAddPhoto} disabled={adding}>
            <Ionicons name="add" size={28} color={WAGYU_COLORS.primary} />
            <Text style={styles.photoAddText}>{adding ? '選択中…' : '追加'}</Text>
          </Pressable>
        )}
      </View>

      <Text style={[styles.label, { marginTop: SPACING.md }]}>評価（★5まで）</Text>
      <View style={styles.starRow}>
        {[1, 2, 3, 4, 5].map((value) => (
          <Pressable key={value} onPress={() => handleSetRating(value)} style={styles.starButton}>
            <Ionicons
              name={value <= displayRating ? 'star' : 'star-outline'}
              size={32}
              color={
                value <= displayRating ? WAGYU_COLORS.accent : WAGYU_COLORS.textMuted
              }
            />
          </Pressable>
        ))}
      </View>
      {displayRating > 0 && (
        <Text style={styles.ratingText}>
          {displayRating} / {STAR_COUNT}
        </Text>
      )}

      <Text style={[styles.label, { marginTop: SPACING.md }]}>コメント</Text>
      <TextInput
        style={styles.commentInput}
        value={commentText}
        onChangeText={setCommentText}
        onBlur={handleSaveComment}
        placeholder="メモや感想をどうぞ"
        placeholderTextColor={WAGYU_COLORS.textMuted}
        multiline
        numberOfLines={3}
      />

      <Text style={[styles.label, { marginTop: SPACING.md }]}>部位メモ（任意）</Text>
      <TextInput
        style={styles.commentInput}
        value={cutMemoText}
        onChangeText={setCutMemoText}
        onBlur={handleSaveCutMemo}
        placeholder="例: ロース、リブロース"
        placeholderTextColor={WAGYU_COLORS.textMuted}
      />

      <Text style={[styles.label, { marginTop: SPACING.md }]}>格付けメモ（任意）</Text>
      <TextInput
        style={styles.commentInput}
        value={gradeMemoText}
        onChangeText={setGradeMemoText}
        onBlur={handleSaveGradeMemo}
        placeholder="例: A5、B4"
        placeholderTextColor={WAGYU_COLORS.textMuted}
      />

      <Pressable style={styles.searchButton} onPress={handleWebSearch}>
        <Ionicons name="search" size={20} color={WAGYU_COLORS.primary} />
        <Text style={styles.searchButtonText}>
          「{prefecture} {wagyuName}」をウェブ検索
        </Text>
      </Pressable>
    </WagyuPatternBackground>
  );
}

export default function WagyuDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ wagyuName: string; prefectures?: string }>();
  const wagyuName = params.wagyuName ?? '';
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

  const [dataMap, setDataMap] = useState<Map<string, PrefectureWagyuPhotoRating>>(new Map());

  const load = useCallback(async () => {
    if (!wagyuName || prefectures.length === 0) return;
    const map = await getWagyuRatingsForBrand(wagyuName, prefectures);
    setDataMap(map);
  }, [wagyuName, prefectures]);

  useEffect(() => {
    load();
  }, [load]);

  const layoutPadding = width <= 375 ? 14 : SPACING.lg;

  if (!wagyuName) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={WAGYU_COLORS.textPrimary} />
        </Pressable>
        <Text style={styles.emptyTitle}>ブランド牛を選択してください</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WagyuPatternBackground
        pattern="stripes"
        style={[
          styles.header,
          { paddingTop: SPACING.md + insets.top, paddingHorizontal: layoutPadding },
        ]}
      >
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={WAGYU_COLORS.textPrimary} />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {wagyuName}
        </Text>
        <Text style={styles.subtitle}>
          写真（最大4枚）・★5・コメント・部位・格付けを登録
        </Text>
      </WagyuPatternBackground>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: layoutPadding,
            paddingBottom: insets.bottom + SPACING.xl * 2,
          },
        ]}
      >
        {prefectures.length === 0 ? (
          <Text style={styles.noPref}>産地データがありません</Text>
        ) : (
          prefectures.map((pref) => (
            <PrefectureBlock
              key={pref}
              prefecture={pref}
              wagyuName={wagyuName}
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
    backgroundColor: WAGYU_COLORS.background,
  },
  header: {
    backgroundColor: WAGYU_COLORS.backgroundElevated,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: WAGYU_COLORS.borderLight,
    ...WAGYU_SHADOWS.header,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: 21,
    fontWeight: '700',
    letterSpacing: 0.2,
    color: WAGYU_COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: WAGYU_COLORS.textMuted,
    marginTop: 4,
    letterSpacing: 0.2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: SPACING.lg,
  },
  emptyTitle: {
    fontSize: 16,
    color: WAGYU_COLORS.textMuted,
    marginTop: SPACING.xl,
    marginLeft: SPACING.lg,
  },
  noPref: {
    fontSize: 14,
    color: WAGYU_COLORS.textMuted,
    marginTop: SPACING.lg,
  },
  block: {
    backgroundColor: WAGYU_COLORS.backgroundElevated,
    borderRadius: 14,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: WAGYU_COLORS.borderLight,
    ...WAGYU_SHADOWS.card,
  },
  blockTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  blockTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
    color: WAGYU_COLORS.textPrimary,
  },
  blockDescriptionWrap: {
    marginBottom: SPACING.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    backgroundColor: WAGYU_COLORS.surface,
    borderRadius: RADIUS.md,
    borderLeftWidth: 3,
    borderLeftColor: WAGYU_COLORS.primary,
  },
  blockDescriptionLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: WAGYU_COLORS.textMuted,
    marginBottom: SPACING.xs,
  },
  blockDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: WAGYU_COLORS.textSecondary,
  },
  achievedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: WAGYU_COLORS.surface,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  achievedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: WAGYU_COLORS.success,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: WAGYU_COLORS.textMuted,
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
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: WAGYU_COLORS.surface,
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
    backgroundColor: WAGYU_COLORS.surface,
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
    borderColor: WAGYU_COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoAddText: {
    fontSize: 11,
    color: WAGYU_COLORS.accent,
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
    color: WAGYU_COLORS.textSecondary,
    marginTop: 4,
  },
  commentInput: {
    backgroundColor: WAGYU_COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    fontSize: 14,
    color: WAGYU_COLORS.textPrimary,
    borderWidth: 1,
    borderColor: WAGYU_COLORS.borderLight,
    minHeight: 72,
    textAlignVertical: 'top',
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: WAGYU_COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.5)',
    ...WAGYU_SHADOWS.card,
  },
  searchButtonText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
    color: WAGYU_COLORS.accent,
  },
});
