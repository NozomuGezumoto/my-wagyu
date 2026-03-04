// ============================================
// 全国ブランド牛一覧 - 地方・県フィルター・出典開閉
// ============================================

import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Linking,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WAGYU_COLORS, SPACING, RADIUS, WAGYU_SHADOWS } from '../constants/theme';
import type { WagyuBrand } from '../types';
import { WAGYU_CITATIONS } from '../data/wagyuData';
import { useWagyuBrandsForList } from '../hooks/useWagyuForList';
import WagyuPatternBackground from './WagyuPatternBackground';

const REGIONS: { key: string; label: string; prefectures: string[] }[] = [
  { key: '北海道', label: '北海道', prefectures: ['北海道'] },
  { key: '東北', label: '東北', prefectures: ['青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県'] },
  { key: '関東', label: '関東', prefectures: ['茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県'] },
  {
    key: '中部',
    label: '中部',
    prefectures: ['新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県', '静岡県', '愛知県', '三重県'],
  },
  { key: '関西', label: '関西', prefectures: ['滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県'] },
  { key: '中国', label: '中国', prefectures: ['鳥取県', '島根県', '岡山県', '広島県', '山口県'] },
  { key: '四国', label: '四国', prefectures: ['徳島県', '香川県', '愛媛県', '高知県'] },
  {
    key: '九州',
    label: '九州・沖縄',
    prefectures: ['福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'],
  },
];
const REGION_PREF_SET = new Map(REGIONS.map((r) => [r.key, new Set(r.prefectures)]));

function getPrefLabel(pref: string): string {
  if (pref === '北海道' || pref === '東京都') return pref === '東京都' ? '東京' : '北海道';
  if (pref === '大阪府' || pref === '京都府') return pref === '大阪府' ? '大阪' : '京都';
  return pref.replace(/県|府$/, '');
}

function WagyuRow({ item }: { item: WagyuBrand }) {
  const router = useRouter();
  const openDetail = () => {
    router.push({
      pathname: '/(tabs)/wagyu-detail',
      params: {
        wagyuName: item.name,
        prefectures: JSON.stringify([item.prefecture]),
      },
    });
  };

  return (
    <Pressable
      style={styles.row}
      onPress={openDetail}
      android_ripple={{ color: WAGYU_COLORS.surface }}
    >
      <WagyuPatternBackground pattern="dots" opacity={0.02} style={StyleSheet.absoluteFill} />
      <View style={styles.rowContent}>
        <View style={styles.rowTitleRow}>
          <Text style={styles.rowName}>{item.name}</Text>
        </View>
        <View style={styles.rowMeta}>
          <View style={styles.metaLine}>
            <Ionicons name="location-outline" size={12} color={WAGYU_COLORS.textMuted} />
            <Text style={styles.metaLabel}>産地</Text>
            <Text style={styles.metaValue} numberOfLines={1}>
              {item.prefecture}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={WAGYU_COLORS.textMuted} />
      </View>
    </Pressable>
  );
}

export default function WagyuListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const layoutPadding = screenWidth <= 375 ? 14 : SPACING.lg;
  const allBrands = useWagyuBrandsForList();
  const [regionFilter, setRegionFilter] = useState<string>('');
  const [prefFilter, setPrefFilter] = useState<string>('');
  const [regionExpanded, setRegionExpanded] = useState(true);
  const [citationsExpanded, setCitationsExpanded] = useState(true);

  const prefsInRegion = useMemo(() => {
    if (!regionFilter) return [];
    return REGIONS.find((r) => r.key === regionFilter)?.prefectures ?? [];
  }, [regionFilter]);

  const filteredBrands = useMemo(() => {
    let list = allBrands;
    if (regionFilter) {
      const prefs = REGION_PREF_SET.get(regionFilter);
      if (prefs) list = list.filter((s) => prefs.has(s.prefecture));
    }
    if (prefFilter) list = list.filter((s) => s.prefecture === prefFilter);
    return list;
  }, [allBrands, regionFilter, prefFilter]);

  const setRegionFilterAndClearPref = (key: string) => {
    setRegionFilter(key);
    setPrefFilter('');
  };

  const citations = WAGYU_CITATIONS;
  const listBottomPadding =
    citations.length > 0
      ? citationsExpanded
        ? 120 + insets.bottom
        : 52 + insets.bottom
      : SPACING.xl + insets.bottom;

  return (
    <View style={styles.container}>
      <WagyuPatternBackground
        pattern="stripes"
        style={[
          styles.header,
          {
            paddingTop: SPACING.md + insets.top,
            paddingHorizontal: layoutPadding,
          },
        ]}
      >
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={WAGYU_COLORS.textPrimary} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>全国ブランド牛一覧</Text>
          <Text style={styles.subtitle}>
            {filteredBrands.length} 銘柄
            {regionFilter ? `・${REGIONS.find((r) => r.key === regionFilter)?.label ?? regionFilter}` : ''}
            {prefFilter ? `・${getPrefLabel(prefFilter)}` : ''}
          </Text>
        </View>
        <Pressable style={styles.headerIconButton} onPress={() => router.push('/(tabs)/my-records')}>
          <Ionicons name="images" size={22} color="#fff" />
          <Text style={styles.headerIconLabel}>マイ記録</Text>
        </Pressable>
      </WagyuPatternBackground>

      <View style={[styles.filterWrap, { paddingHorizontal: layoutPadding }]}>
        <Pressable style={styles.filterSectionHeader} onPress={() => setRegionExpanded((e) => !e)}>
          <Text style={styles.filterSectionLabel}>地方・県</Text>
          <Ionicons
            name={regionExpanded ? 'chevron-down' : 'chevron-forward'}
            size={18}
            color={WAGYU_COLORS.textMuted}
          />
        </Pressable>
        {regionExpanded && (
          <>
            <View style={styles.filterRow}>
              <Pressable
                style={[styles.filterChip, styles.filterChipSmall, !regionFilter && styles.filterChipActive]}
                onPress={() => {
                  setRegionFilter('');
                  setPrefFilter('');
                }}
              >
                <Text style={[styles.filterChipText, !regionFilter && styles.filterChipTextActive]}>
                  すべて
                </Text>
              </Pressable>
              {REGIONS.map((r) => (
                <Pressable
                  key={r.key}
                  style={[
                    styles.filterChip,
                    styles.filterChipSmall,
                    regionFilter === r.key && styles.filterChipActive,
                  ]}
                  onPress={() => setRegionFilterAndClearPref(r.key)}
                >
                  <Text
                    style={[styles.filterChipText, regionFilter === r.key && styles.filterChipTextActive]}
                  >
                    {r.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            {prefsInRegion.length > 0 && (
              <>
                <Text style={[styles.filterSectionLabel, styles.filterSubLabel]}>県</Text>
                <View style={styles.filterRow}>
                  <Pressable
                    style={[styles.filterChip, styles.filterChipSmall, !prefFilter && styles.filterChipActive]}
                    onPress={() => setPrefFilter('')}
                  >
                    <Text style={[styles.filterChipText, !prefFilter && styles.filterChipTextActive]}>
                      すべて
                    </Text>
                  </Pressable>
                  {prefsInRegion.map((pref) => (
                    <Pressable
                      key={pref}
                      style={[
                        styles.filterChip,
                        styles.filterChipSmall,
                        prefFilter === pref && styles.filterChipActive,
                      ]}
                      onPress={() => setPrefFilter(pref)}
                    >
                      <Text
                        style={[styles.filterChipText, prefFilter === pref && styles.filterChipTextActive]}
                      >
                        {getPrefLabel(pref)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}
          </>
        )}
      </View>

      <FlatList
        data={filteredBrands}
        keyExtractor={(item) => `${item.prefecture}|${item.name}`}
        renderItem={({ item }) => <WagyuRow item={item} />}
        contentContainerStyle={[
          styles.listContent,
          { paddingHorizontal: layoutPadding, paddingBottom: listBottomPadding },
        ]}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>該当する銘柄はありません</Text>
            <Text style={styles.emptyHint}>地方・県で絞り込んでください</Text>
          </View>
        }
      />
      {citations.length > 0 && (
        <View
          style={[
            styles.footer,
            {
              paddingBottom: SPACING.md + insets.bottom,
              paddingHorizontal: layoutPadding,
            },
          ]}
        >
          <Pressable style={styles.footerHeader} onPress={() => setCitationsExpanded((e) => !e)}>
            <Text style={styles.footerTitle}>出典</Text>
            <Ionicons
              name={citationsExpanded ? 'chevron-down' : 'chevron-forward'}
              size={18}
              color={WAGYU_COLORS.textMuted}
            />
          </Pressable>
          {citationsExpanded && (
            <View style={styles.footerCitations}>
              {citations.slice(0, 3).map((c, i) =>
                c.url ? (
                  <Pressable
                    key={i}
                    onPress={() => Linking.openURL(c.url!)}
                    style={styles.citationLink}
                  >
                    <Text style={styles.citationText} numberOfLines={2}>
                      {c.title}
                    </Text>
                    <Ionicons
                      name="open-outline"
                      size={12}
                      color={WAGYU_COLORS.primary}
                      style={{ marginLeft: 2 }}
                    />
                  </Pressable>
                ) : (
                  <View key={i} style={styles.citationLink}>
                    <Text style={styles.citationText} numberOfLines={2}>
                      {c.title}
                    </Text>
                    {c.description && (
                      <Text style={styles.citationDesc} numberOfLines={1}>
                        {c.description}
                      </Text>
                    )}
                  </View>
                )
              )}
            </View>
          )}
        </View>
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
    backgroundColor: WAGYU_COLORS.backgroundElevated,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: WAGYU_COLORS.borderLight,
    ...WAGYU_SHADOWS.header,
  },
  backButton: {
    padding: SPACING.xs,
    marginRight: SPACING.sm,
  },
  headerIconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    backgroundColor: WAGYU_COLORS.accent,
    borderRadius: RADIUS.full,
    marginLeft: SPACING.sm,
    ...WAGYU_SHADOWS.cardStrong,
  },
  headerIconLabel: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: '#0a0a0a',
  },
  headerText: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: 0.2,
    color: WAGYU_COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: WAGYU_COLORS.textMuted,
    marginTop: 4,
    letterSpacing: 0.2,
  },
  filterWrap: {
    flexDirection: 'column',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    paddingBottom: SPACING.lg,
    backgroundColor: WAGYU_COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: WAGYU_COLORS.borderLight,
  },
  filterSectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: WAGYU_COLORS.textMuted,
    marginBottom: 2,
  },
  filterSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
    marginBottom: 2,
  },
  filterSubLabel: {
    marginBottom: 2,
    marginTop: SPACING.xs,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    minWidth: 44,
    flexShrink: 0,
    borderRadius: RADIUS.full,
    backgroundColor: WAGYU_COLORS.backgroundElevated,
    borderWidth: 1,
    borderColor: WAGYU_COLORS.borderLight,
  },
  filterChipSmall: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    minWidth: 40,
  },
  filterChipActive: {
    backgroundColor: WAGYU_COLORS.accent,
    borderColor: WAGYU_COLORS.accent,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: WAGYU_COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: '#0a0a0a',
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  row: {
    backgroundColor: WAGYU_COLORS.backgroundElevated,
    minHeight: 76,
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: WAGYU_COLORS.borderLight,
    overflow: 'hidden',
    ...WAGYU_SHADOWS.card,
  },
  rowContent: {
    flex: 1,
  },
  rowTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: 6,
  },
  rowName: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
    color: WAGYU_COLORS.textPrimary,
  },
  rowMeta: {
    gap: 4,
  },
  metaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  metaLabel: {
    fontSize: 11,
    color: WAGYU_COLORS.textMuted,
    width: 40,
  },
  metaValue: {
    flex: 1,
    fontSize: 12,
    color: WAGYU_COLORS.textSecondary,
  },
  separator: {
    height: SPACING.sm,
  },
  empty: {
    paddingVertical: SPACING.xl * 2,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: WAGYU_COLORS.textSecondary,
  },
  emptyHint: {
    fontSize: 13,
    color: WAGYU_COLORS.textMuted,
    marginTop: SPACING.sm,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: WAGYU_COLORS.surface,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: WAGYU_COLORS.borderLight,
  },
  footerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerCitations: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    alignItems: 'center',
    marginTop: 6,
  },
  footerTitle: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: WAGYU_COLORS.textMuted,
  },
  citationLink: {
    flexDirection: 'column',
    alignSelf: 'flex-start',
    maxWidth: '85%',
  },
  citationText: {
    fontSize: 11,
    color: WAGYU_COLORS.accent,
    flexShrink: 1,
  },
  citationDesc: {
    fontSize: 10,
    color: WAGYU_COLORS.textMuted,
    marginTop: 2,
  },
});
