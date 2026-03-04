// ============================================
// 写真・星・コメントがあるもの一覧
// ============================================

import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SUSHI_COLORS, SPACING, RADIUS } from '../constants/theme';
import type { PrefectureFishPhotoRating } from '../types';
import { getPhotoRatingsWithContent } from '../data/photoRatingStorage';

export default function MyRecordsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const layoutPadding = Math.max(SPACING.lg, insets.left);
  const [list, setList] = useState<PrefectureFishPhotoRating[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getPhotoRatingsWithContent();
    setList(data);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const openDetail = (item: PrefectureFishPhotoRating) => {
    router.push({
      pathname: '/(tabs)/fish-detail',
      params: {
        fishName: item.fishName,
        prefectures: JSON.stringify([item.prefecture]),
      },
    });
  };

  const hasPhoto = (e: PrefectureFishPhotoRating) => e.photoUris.length > 0;
  const hasRating = (e: PrefectureFishPhotoRating) => e.rating != null && e.rating >= 1;
  const hasComment = (e: PrefectureFishPhotoRating) =>
    e.comment != null && e.comment.trim() !== '';

  const renderItem = ({ item }: { item: PrefectureFishPhotoRating }) => (
    <Pressable
      style={styles.row}
      onPress={() => openDetail(item)}
      android_ripple={{ color: SUSHI_COLORS.surface }}
    >
      <View style={styles.rowMain}>
        <Text style={styles.fishName}>{item.fishName}</Text>
        <Text style={styles.prefecture}>{item.prefecture}</Text>
      </View>
      <View style={styles.badges}>
        {hasPhoto(item) && (
          <View style={styles.badge}>
            <Ionicons name="images" size={14} color={SUSHI_COLORS.primary} />
            <Text style={styles.badgeCount}>{item.photoUris.length}</Text>
          </View>
        )}
        {hasRating(item) && (
          <View style={styles.badge}>
            <Ionicons name="star" size={14} color={SUSHI_COLORS.accentTertiary} />
            <Text style={styles.badgeText}>{item.rating}</Text>
          </View>
        )}
        {hasComment(item) && (
          <View style={styles.badge}>
            <Ionicons name="chatbubble-outline" size={14} color={SUSHI_COLORS.textSecondary} />
          </View>
        )}
      </View>
      <Ionicons name="chevron-forward" size={18} color={SUSHI_COLORS.textMuted} />
    </Pressable>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={[styles.header, { paddingHorizontal: layoutPadding }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={SUSHI_COLORS.textPrimary} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>写真・星・コメント</Text>
          <Text style={styles.subtitle}>記録がある魚介の一覧</Text>
        </View>
      </View>
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={SUSHI_COLORS.primary} />
        </View>
      ) : list.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="images-outline" size={48} color={SUSHI_COLORS.textMuted} />
          <Text style={styles.emptyText}>まだ記録がありません</Text>
          <Text style={styles.emptyHint}>地図や一覧から魚を選び、写真・評価をつけましょう</Text>
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => `${item.prefecture}|${item.fishName}`}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            { paddingHorizontal: layoutPadding, paddingBottom: insets.bottom + SPACING.xl },
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SUSHI_COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingBottom: SPACING.sm,
    backgroundColor: SUSHI_COLORS.backgroundElevated,
    borderBottomWidth: 1,
    borderBottomColor: SUSHI_COLORS.border,
  },
  backButton: {
    padding: SPACING.xs,
    marginRight: SPACING.sm,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: SUSHI_COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: SUSHI_COLORS.textSecondary,
    marginTop: 2,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyText: {
    fontSize: 16,
    color: SUSHI_COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  emptyHint: {
    fontSize: 13,
    color: SUSHI_COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  listContent: {
    paddingTop: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    backgroundColor: SUSHI_COLORS.backgroundElevated,
    borderRadius: RADIUS.md,
    marginTop: SPACING.xs,
  },
  rowMain: {
    flex: 1,
    minWidth: 0,
  },
  fishName: {
    fontSize: 16,
    fontWeight: '600',
    color: SUSHI_COLORS.textPrimary,
  },
  prefecture: {
    fontSize: 13,
    color: SUSHI_COLORS.textSecondary,
    marginTop: 2,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginRight: SPACING.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  badgeCount: {
    fontSize: 12,
    color: SUSHI_COLORS.primary,
    fontWeight: '600',
  },
  badgeText: {
    fontSize: 12,
    color: SUSHI_COLORS.accentTertiary,
    fontWeight: '600',
  },
  separator: {
    height: SPACING.xs,
  },
});
