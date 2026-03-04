// ============================================
// Fish List Screen - 旬の魚・名産地一覧
// ============================================

import React, { useCallback, useMemo, useState } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SUSHI_COLORS, SPACING, RADIUS } from '../constants/theme';
import type { FishSpecies } from '../types';
import {
  formatSeasonMonths,
  getFishSeasonOriginData,
  isPremiumFish,
  SEASON_FILTER_OPTIONS,
  isInSeasonForMonths,
} from '../data/fishData';
import { useFishSpeciesForList } from '../hooks/useFishSpeciesForList';

// 地方 → 都道府県（フィルタ用）
const REGIONS: { key: string; label: string; prefectures: string[] }[] = [
  { key: '北海道', label: '北海道', prefectures: ['北海道'] },
  { key: '東北', label: '東北', prefectures: ['青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県'] },
  { key: '関東', label: '関東', prefectures: ['茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県'] },
  { key: '中部', label: '中部', prefectures: ['新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県', '静岡県', '愛知県', '三重県'] },
  { key: '関西', label: '関西', prefectures: ['滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県'] },
  { key: '中国', label: '中国', prefectures: ['鳥取県', '島根県', '岡山県', '広島県', '山口県'] },
  { key: '四国', label: '四国', prefectures: ['徳島県', '香川県', '愛媛県', '高知県'] },
  { key: '九州', label: '九州・沖縄', prefectures: ['福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'] },
];
const REGION_PREF_SET = new Map(REGIONS.map(r => [r.key, new Set(r.prefectures)]));

// 県の表示名（短縮）
function getPrefLabel(pref: string): string {
  if (pref === '北海道' || pref === '東京都') return pref === '東京都' ? '東京' : '北海道';
  if (pref === '大阪府' || pref === '京都府') return pref === '大阪府' ? '大阪' : '京都';
  return pref.replace(/県|府$/, '');
}

// 五十音の行（フィルタ用）。各行の頭文字でマッチ
const GOJUON_ROWS = [
  { key: '', label: 'すべて' },
  { key: 'ア', label: 'ア' }, // ア行
  { key: 'カ', label: 'カ' }, // カ行 カキクケコ
  { key: 'サ', label: 'サ' }, // サ行
  { key: 'タ', label: 'タ' }, // タ行
  { key: 'ナ', label: 'ナ' }, // ナ行
  { key: 'ハ', label: 'ハ' }, // ハ行
  { key: 'マ', label: 'マ' }, // マ行
  { key: 'ヤ', label: 'ヤ' }, // ヤ行
  { key: 'ラ', label: 'ラ' }, // ラ行
  { key: 'ワ', label: 'ワ' }, // ワ行
];

const KANA_ROW_MAP: Record<string, string> = {
  'ア': 'ア', 'イ': 'ア', 'ウ': 'ア', 'エ': 'ア', 'オ': 'ア',
  'カ': 'カ', 'キ': 'カ', 'ク': 'カ', 'ケ': 'カ', 'コ': 'カ',
  'サ': 'サ', 'シ': 'サ', 'ス': 'サ', 'セ': 'サ', 'ソ': 'サ',
  'タ': 'タ', 'チ': 'タ', 'ツ': 'タ', 'テ': 'タ', 'ト': 'タ',
  'ナ': 'ナ', 'ニ': 'ナ', 'ヌ': 'ナ', 'ネ': 'ナ', 'ノ': 'ナ',
  'ハ': 'ハ', 'ヒ': 'ハ', 'フ': 'ハ', 'ヘ': 'ハ', 'ホ': 'ハ',
  'マ': 'マ', 'ミ': 'マ', 'ム': 'マ', 'メ': 'マ', 'モ': 'マ',
  'ヤ': 'ヤ', 'ユ': 'ヤ', 'ヨ': 'ヤ',
  'ラ': 'ラ', 'リ': 'ラ', 'ル': 'ラ', 'レ': 'ラ', 'ロ': 'ラ',
  'ワ': 'ワ', 'ヲ': 'ワ', 'ン': 'ワ',
};

function getFirstRow(name: string): string {
  const first = name.charAt(0);
  return KANA_ROW_MAP[first] ?? '';
}

function FishRow({ item }: { item: FishSpecies }) {
  const router = useRouter();
  const seasonText = item.seasonDisplay
    ?? (item.season?.length
      ? (formatSeasonMonths(item.season[0].months) || '—')
      : '—');
  const originText = item.famousOrigin?.prefectures?.length
    ? (() => {
        const p = item.famousOrigin!.prefectures;
        if (p.length <= 3) return p.join('、');
        return p.slice(0, 3).join('、') + ` 他${p.length - 3}県`;
      })()
    : '—';
  const prefectureCount = item.famousOrigin?.prefectures?.length ?? 0;
  const showMeisan = prefectureCount >= 2;
  const showPremium = isPremiumFish(item.name);

  const openDetail = () => {
    router.push({
      pathname: '/(tabs)/fish-detail',
      params: {
        fishName: item.name,
        prefectures: JSON.stringify(item.famousOrigin?.prefectures ?? []),
      },
    });
  };

  return (
    <Pressable style={styles.row} onPress={openDetail} android_ripple={{ color: SUSHI_COLORS.surface }}>
      <View style={styles.rowTitleRow}>
        <Text style={styles.rowName}>{item.name}</Text>
        <View style={styles.badgeRow}>
          {showMeisan && (
            <View style={styles.badgeMeisan}>
              <Text style={styles.badgeMeisanText}>名産</Text>
            </View>
          )}
          {showPremium && (
            <View style={styles.badgePremium}>
              <Text style={styles.badgePremiumText}>高級</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.rowMeta}>
        <View style={styles.metaLine}>
          <Ionicons name="calendar-outline" size={12} color={SUSHI_COLORS.textMuted} />
          <Text style={styles.metaLabel}>旬</Text>
          <Text style={styles.metaValue} numberOfLines={1}>{seasonText}</Text>
        </View>
        <View style={styles.metaLine}>
          <Ionicons name="location-outline" size={12} color={SUSHI_COLORS.textMuted} />
          <Text style={styles.metaLabel}>名産地</Text>
          <Text style={styles.metaValue} numberOfLines={1}>{originText}</Text>
        </View>
      </View>
      <View style={styles.rowChevron}>
        <Ionicons name="chevron-forward" size={18} color={SUSHI_COLORS.textMuted} />
      </View>
    </Pressable>
  );
}

export default function FishListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const layoutPadding = screenWidth <= 375 ? 14 : SPACING.lg;
  const { species: allSpecies, refresh } = useFishSpeciesForList();
  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));
  const [filterRow, setFilterRow] = useState<string>('');
  const [regionFilter, setRegionFilter] = useState<string>('');
  const [prefFilter, setPrefFilter] = useState<string>('');
  const [seasonFilter, setSeasonFilter] = useState<string>('');
  const [kanaExpanded, setKanaExpanded] = useState(true);
  const [regionExpanded, setRegionExpanded] = useState(true);
  const [seasonExpanded, setSeasonExpanded] = useState(true);
  const [citationsExpanded, setCitationsExpanded] = useState(true);
  const prefsInRegion = useMemo(() => {
    if (!regionFilter) return [];
    return REGIONS.find(r => r.key === regionFilter)?.prefectures ?? [];
  }, [regionFilter]);
  const filteredSpecies = useMemo(() => {
    let list = allSpecies;
    if (filterRow) list = list.filter(s => getFirstRow(s.name) === filterRow);
    if (regionFilter) {
      const prefs = REGION_PREF_SET.get(regionFilter);
      if (prefs) {
        list = list.filter(s => {
          const fishPrefs = s.famousOrigin?.prefectures ?? [];
          return fishPrefs.some(p => prefs.has(p));
        });
      }
    }
    if (prefFilter) {
      list = list.filter(s => s.famousOrigin?.prefectures?.includes(prefFilter) ?? false);
    }
    if (seasonFilter) {
      const opt = SEASON_FILTER_OPTIONS.find(o => o.key === seasonFilter);
      if (opt?.months.length) list = list.filter(s => isInSeasonForMonths(s, opt.months));
    }
    return list;
  }, [allSpecies, filterRow, regionFilter, prefFilter, seasonFilter]);
  const data = getFishSeasonOriginData();
  const citations = data?.citations ?? [];
  const setRegionFilterAndClearPref = (key: string) => {
    setRegionFilter(key);
    setPrefFilter('');
  };
  const listBottomPadding = citations.length > 0
    ? (citationsExpanded ? 120 + insets.bottom : 52 + insets.bottom)
    : SPACING.xl + insets.bottom;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: SPACING.md + insets.top, paddingHorizontal: layoutPadding }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={SUSHI_COLORS.textPrimary} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>旬の魚・名産地</Text>
          <Text style={styles.subtitle}>
            {filteredSpecies.length} 魚種
            {filterRow ? `（${filterRow}行）` : ''}
            {regionFilter ? `・${REGIONS.find(r => r.key === regionFilter)?.label ?? regionFilter}` : ''}
            {prefFilter ? `・${getPrefLabel(prefFilter)}` : ''}
            {seasonFilter ? `・${SEASON_FILTER_OPTIONS.find(o => o.key === seasonFilter)?.label ?? ''}` : ''}
          </Text>
        </View>
        <Pressable style={styles.headerIconButton} onPress={() => router.push('/(tabs)/my-records')}>
          <Ionicons name="images" size={22} color={SUSHI_COLORS.primary} />
          <Text style={styles.headerIconLabel}>マイ記録</Text>
        </Pressable>
        <Pressable style={styles.addButton} onPress={() => router.push('/(tabs)/add-fish')}>
          <Ionicons name="add-circle-outline" size={26} color={SUSHI_COLORS.primary} />
        </Pressable>
      </View>

      <View style={[styles.filterWrap, { paddingHorizontal: layoutPadding }]}>
        <Pressable style={styles.filterSectionHeader} onPress={() => setKanaExpanded(e => !e)}>
          <Text style={styles.filterSectionLabel}>あいうえお</Text>
          <Ionicons name={kanaExpanded ? 'chevron-down' : 'chevron-forward'} size={18} color={SUSHI_COLORS.textMuted} />
        </Pressable>
        {kanaExpanded && (
          <View style={styles.filterRow}>
            {GOJUON_ROWS.map(({ key, label }) => (
              <Pressable
                key={key || 'all'}
                style={[styles.filterChip, filterRow === key && styles.filterChipActive]}
                onPress={() => setFilterRow(key)}
              >
                <Text style={[styles.filterChipText, filterRow === key && styles.filterChipTextActive]}>{label}</Text>
              </Pressable>
            ))}
          </View>
        )}
        <Pressable style={styles.filterSectionHeader} onPress={() => setRegionExpanded(e => !e)}>
          <Text style={styles.filterSectionLabel}>地方・県</Text>
          <Ionicons name={regionExpanded ? 'chevron-down' : 'chevron-forward'} size={18} color={SUSHI_COLORS.textMuted} />
        </Pressable>
        {regionExpanded && (
          <>
            <View style={styles.filterRow}>
              <Pressable
                style={[styles.filterChip, styles.filterChipSmall, !regionFilter && styles.filterChipActive]}
                onPress={() => { setRegionFilter(''); setPrefFilter(''); }}
              >
                <Text style={[styles.filterChipText, !regionFilter && styles.filterChipTextActive]}>すべて</Text>
              </Pressable>
              {REGIONS.map((r) => (
                <Pressable
                  key={r.key}
                  style={[styles.filterChip, styles.filterChipSmall, regionFilter === r.key && styles.filterChipActive]}
                  onPress={() => setRegionFilterAndClearPref(r.key)}
                >
                  <Text style={[styles.filterChipText, regionFilter === r.key && styles.filterChipTextActive]}>{r.label}</Text>
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
                    <Text style={[styles.filterChipText, !prefFilter && styles.filterChipTextActive]}>すべて</Text>
                  </Pressable>
                  {prefsInRegion.map((pref) => (
                    <Pressable
                      key={pref}
                      style={[styles.filterChip, styles.filterChipSmall, prefFilter === pref && styles.filterChipActive]}
                      onPress={() => setPrefFilter(pref)}
                    >
                      <Text style={[styles.filterChipText, prefFilter === pref && styles.filterChipTextActive]}>{getPrefLabel(pref)}</Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}
          </>
        )}
        <Pressable style={styles.filterSectionHeader} onPress={() => setSeasonExpanded(e => !e)}>
          <Text style={styles.filterSectionLabel}>季節</Text>
          <Ionicons name={seasonExpanded ? 'chevron-down' : 'chevron-forward'} size={18} color={SUSHI_COLORS.textMuted} />
        </Pressable>
        {seasonExpanded && (
          <View style={styles.filterRow}>
            {SEASON_FILTER_OPTIONS.map(({ key, label }) => (
              <Pressable
                key={key || 'all'}
                style={[styles.filterChip, styles.filterChipSmall, seasonFilter === key && styles.filterChipActive]}
                onPress={() => setSeasonFilter(key)}
              >
                <Text style={[styles.filterChipText, seasonFilter === key && styles.filterChipTextActive]}>{label}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <FlatList
        data={filteredSpecies}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => <FishRow item={item} />}
        contentContainerStyle={[styles.listContent, { paddingHorizontal: layoutPadding, paddingBottom: listBottomPadding }]}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>該当する魚はありません</Text>
            <Text style={styles.emptyHint}>あいうえお・地方・県・季節で絞り込んでください</Text>
          </View>
        }
      />
      {citations.length > 0 && (
        <View style={[styles.footer, { paddingBottom: SPACING.md + insets.bottom, paddingHorizontal: layoutPadding }]}>
          <Pressable style={styles.footerHeader} onPress={() => setCitationsExpanded(e => !e)}>
            <Text style={styles.footerTitle}>出典</Text>
            <Ionicons name={citationsExpanded ? 'chevron-down' : 'chevron-forward'} size={18} color={SUSHI_COLORS.textMuted} />
          </Pressable>
          {citationsExpanded && (
            <View style={styles.footerCitations}>
              {citations.slice(0, 3).map((c, i) => (
                c.url ? (
                  <Pressable key={i} onPress={() => Linking.openURL(c.url!)} style={styles.citationLink}>
                    <Text style={styles.citationText} numberOfLines={2}>{c.title}</Text>
                    <Ionicons name="open-outline" size={12} color={SUSHI_COLORS.primary} style={{ marginLeft: 2 }} />
                  </Pressable>
                ) : (
                  <View key={i} style={styles.citationLink}>
                    <Text style={styles.citationText} numberOfLines={2}>{c.title}</Text>
                  </View>
                )
              ))}
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
    backgroundColor: SUSHI_COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SUSHI_COLORS.backgroundElevated,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: SUSHI_COLORS.border,
  },
  backButton: {
    padding: SPACING.xs,
    marginRight: SPACING.sm,
  },
  headerIconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    marginLeft: SPACING.sm,
  },
  headerIconLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: SUSHI_COLORS.primary,
  },
  addButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  headerText: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: SUSHI_COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: SUSHI_COLORS.textMuted,
    marginTop: 2,
  },
  filterWrap: {
    flexDirection: 'column',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    paddingBottom: SPACING.md,
    backgroundColor: SUSHI_COLORS.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: SUSHI_COLORS.border,
  },
  filterSectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: SUSHI_COLORS.textMuted,
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 44,
    flexShrink: 0,
    borderRadius: RADIUS.full,
    backgroundColor: SUSHI_COLORS.backgroundElevated,
  },
  filterChipSmall: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 40,
  },
  filterChipActive: {
    backgroundColor: SUSHI_COLORS.primary,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: SUSHI_COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  row: {
    backgroundColor: SUSHI_COLORS.backgroundElevated,
    minHeight: 72,
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
  },
  rowTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: 6,
  },
  rowChevron: {
    marginLeft: SPACING.xs,
  },
  rowName: {
    fontSize: 16,
    fontWeight: '600',
    color: SUSHI_COLORS.textPrimary,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  badgeMeisan: {
    backgroundColor: SUSHI_COLORS.accentSecondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  badgeMeisanText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  badgePremium: {
    backgroundColor: SUSHI_COLORS.accentTertiary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  badgePremiumText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
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
    color: SUSHI_COLORS.textMuted,
    width: 40,
  },
  metaValue: {
    flex: 1,
    fontSize: 12,
    color: SUSHI_COLORS.textSecondary,
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
    color: SUSHI_COLORS.textSecondary,
  },
  emptyHint: {
    fontSize: 13,
    color: SUSHI_COLORS.textMuted,
    marginTop: SPACING.sm,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: SUSHI_COLORS.surface,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: SUSHI_COLORS.border,
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
    color: SUSHI_COLORS.textMuted,
  },
  citationLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    maxWidth: '85%',
  },
  citationText: {
    fontSize: 11,
    color: SUSHI_COLORS.primary,
    flexShrink: 1,
  },
});
