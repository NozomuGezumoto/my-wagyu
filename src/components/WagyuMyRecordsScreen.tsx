// ============================================
// マイ記録 - 写真・星・コメントがあるブランド牛のみ表示、タップで詳細へ
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
import { WAGYU_COLORS, SPACING, RADIUS, WAGYU_SHADOWS } from '../constants/theme';
import type { PrefectureWagyuPhotoRating } from '../types';
import { getWagyuRatingsWithContent } from '../data/wagyuRatingStorage';
import WagyuPatternBackground from './WagyuPatternBackground';

export default function WagyuMyRecordsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const layoutPadding = Math.max(SPACING.lg, insets.left);
  const [list, setList] = useState<PrefectureWagyuPhotoRating[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getWagyuRatingsWithContent();
    setList(data);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const openDetail = (item: PrefectureWagyuPhotoRating) => {
    router.push({
      pathname: '/(tabs)/wagyu-detail',
      params: {
        wagyuName: item.wagyuName,
        prefectures: JSON.stringify([item.prefecture]),
      },
    });
  };

  const hasPhoto = (e: PrefectureWagyuPhotoRating) => e.photoUris.length > 0;
  const hasRating = (e: PrefectureWagyuPhotoRating) => e.rating != null && e.rating >= 1;
  const hasComment = (e: PrefectureWagyuPhotoRating) =>
    e.comment != null && e.comment.trim() !== '';

  const renderItem = ({ item }: { item: PrefectureWagyuPhotoRating }) => (
    <Pressable
      style={styles.row}
      onPress={() => openDetail(item)}
      android_ripple={{ color: WAGYU_COLORS.surface }}
    >
      <WagyuPatternBackground pattern="dots" opacity={0.02} style={StyleSheet.absoluteFill} />
      <View style={styles.rowContent}>
        <View style={styles.rowMain}>
          <Text style={styles.wagyuName}>{item.wagyuName}</Text>
          <Text style={styles.prefecture}>{item.prefecture}</Text>
        </View>
        <View style={styles.badges}>
          {hasPhoto(item) && (
            <View style={styles.badge}>
              <Ionicons name="images" size={14} color={WAGYU_COLORS.primary} />
              <Text style={styles.badgeCount}>{item.photoUris.length}</Text>
            </View>
          )}
          {hasRating(item) && (
            <View style={styles.badge}>
              <Ionicons name="star" size={14} color={WAGYU_COLORS.accent} />
              <Text style={styles.badgeText}>{item.rating}</Text>
            </View>
          )}
          {hasComment(item) && (
            <View style={styles.badge}>
              <Ionicons name="chatbubble-outline" size={14} color={WAGYU_COLORS.textSecondary} />
            </View>
          )}
        </View>
        <Ionicons name="chevron-forward" size={18} color={WAGYU_COLORS.textMuted} />
      </View>
    </Pressable>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <WagyuPatternBackground
        pattern="stripes"
        style={[styles.header, { paddingHorizontal: layoutPadding }]}
      >
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={WAGYU_COLORS.textPrimary} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>マイ記録</Text>
          <Text style={styles.subtitle}>写真・星・コメントがあるブランド牛</Text>
        </View>
      </WagyuPatternBackground>
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={WAGYU_COLORS.primary} />
        </View>
      ) : list.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="images-outline" size={48} color={WAGYU_COLORS.textMuted} />
          <Text style={styles.emptyText}>まだ記録がありません</Text>
          <Text style={styles.emptyHint}>
            地図や一覧からブランド牛を選び、写真・評価をつけましょう
          </Text>
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => `${item.prefecture}|${item.wagyuName}`}
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
    backgroundColor: WAGYU_COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingBottom: SPACING.lg,
    backgroundColor: WAGYU_COLORS.backgroundElevated,
    borderBottomWidth: 1,
    borderBottomColor: WAGYU_COLORS.borderLight,
    ...WAGYU_SHADOWS.header,
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
    letterSpacing: 0.2,
    color: WAGYU_COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: WAGYU_COLORS.textSecondary,
    marginTop: 4,
    letterSpacing: 0.2,
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
    color: WAGYU_COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  emptyHint: {
    fontSize: 13,
    color: WAGYU_COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  listContent: {
    paddingTop: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: WAGYU_COLORS.backgroundElevated,
    borderRadius: 12,
    marginTop: SPACING.xs,
    borderWidth: 1,
    borderColor: WAGYU_COLORS.borderLight,
    overflow: 'hidden',
    ...WAGYU_SHADOWS.card,
  },
  rowContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  rowMain: {
    flex: 1,
    minWidth: 0,
  },
  wagyuName: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
    color: WAGYU_COLORS.textPrimary,
  },
  prefecture: {
    fontSize: 13,
    color: WAGYU_COLORS.textSecondary,
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
    color: WAGYU_COLORS.accent,
    fontWeight: '600',
  },
  badgeText: {
    fontSize: 12,
    color: WAGYU_COLORS.accent,
    fontWeight: '600',
  },
  separator: {
    height: SPACING.xs,
  },
});
