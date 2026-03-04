// ============================================
// データ追加画面 - 魚介・名産地・旬を追加
// ============================================

import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SUSHI_COLORS, SPACING, RADIUS } from '../constants/theme';
import type { UserAddedFish } from '../types';
import { useUserFishData } from '../hooks/useFishSpeciesForList';

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

function getPrefLabel(pref: string): string {
  if (pref === '北海道' || pref === '東京都') return pref === '東京都' ? '東京' : '北海道';
  if (pref === '大阪府' || pref === '京都府') return pref === '大阪府' ? '大阪' : '京都';
  return pref.replace(/県|府$/, '');
}

export default function AddFishScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const layoutPadding = screenWidth <= 375 ? 14 : SPACING.lg;
  const { userAdded, addFish, removeFish, refresh } = useUserFishData();

  const [name, setName] = useState('');
  const [prefectures, setPrefectures] = useState<string[]>([]);
  const [seasonDisplay, setSeasonDisplay] = useState('');
  const [prefSectionOpen, setPrefSectionOpen] = useState(false);

  useEffect(() => { refresh(); }, [refresh]);

  const togglePrefecture = useCallback((pref: string) => {
    setPrefectures((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
    );
  }, []);

  const handleSave = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    await addFish({
      name: trimmed,
      prefectures: prefectures.length ? prefectures : undefined,
      seasonDisplay: seasonDisplay.trim() || undefined,
    });
    setName('');
    setPrefectures([]);
    setSeasonDisplay('');
    router.back();
  }, [name, prefectures, seasonDisplay, addFish, router]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top + 56}
    >
      <View style={[styles.header, { paddingTop: SPACING.md + insets.top, paddingHorizontal: layoutPadding }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={SUSHI_COLORS.textPrimary} />
        </Pressable>
        <Text style={styles.title}>データを追加</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: layoutPadding, paddingBottom: insets.bottom + SPACING.xl * 2 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <Text style={styles.label}>魚介名</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="例: マグロ、明太子"
            placeholderTextColor={SUSHI_COLORS.textMuted}
          />
        </View>

        <View style={styles.section}>
          <Pressable style={styles.sectionHeader} onPress={() => setPrefSectionOpen((o) => !o)}>
            <Text style={styles.label}>名産地（任意・複数可）</Text>
            <Ionicons name={prefSectionOpen ? 'chevron-down' : 'chevron-forward'} size={18} color={SUSHI_COLORS.textMuted} />
          </Pressable>
          {prefSectionOpen && (
            <View style={styles.chipWrap}>
              {REGIONS.map((r) => (
                <View key={r.key} style={styles.regionBlock}>
                  <Text style={styles.regionLabel}>{r.label}</Text>
                  <View style={styles.chipRow}>
                    {r.prefectures.map((pref) => {
                      const selected = prefectures.includes(pref);
                      return (
                        <Pressable
                          key={pref}
                          style={[styles.chip, selected && styles.chipActive]}
                          onPress={() => togglePrefecture(pref)}
                        >
                          <Text style={[styles.chipText, selected && styles.chipTextActive]}>{getPrefLabel(pref)}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          )}
          {prefectures.length > 0 && (
            <Text style={styles.hint}>選択: {prefectures.map(getPrefLabel).join('、')}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>旬（任意）</Text>
          <TextInput
            style={styles.input}
            value={seasonDisplay}
            onChangeText={setSeasonDisplay}
            placeholder="例: 春～夏、10月～2月、通年"
            placeholderTextColor={SUSHI_COLORS.textMuted}
          />
        </View>

        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>保存して一覧に反映</Text>
        </Pressable>

        {userAdded.length > 0 && (
          <View style={styles.addedSection}>
            <Text style={styles.addedTitle}>追加したデータ</Text>
            {userAdded.map((entry, index) => (
              <View key={`${entry.name}-${entry.addedAt ?? index}`} style={styles.addedRow}>
                <View style={styles.addedRowText}>
                  <Text style={styles.addedName}>{entry.name}</Text>
                  {(entry.prefectures?.length ?? 0) > 0 && (
                    <Text style={styles.addedMeta}>{entry.prefectures!.map(getPrefLabel).join('、')}</Text>
                  )}
                  {entry.seasonDisplay && (
                    <Text style={styles.addedMeta}>旬: {entry.seasonDisplay}</Text>
                  )}
                </View>
                <Pressable style={styles.deleteButton} onPress={() => removeFish(index)}>
                  <Ionicons name="trash-outline" size={20} color={SUSHI_COLORS.error} />
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingBottom: SPACING.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: SUSHI_COLORS.border,
  },
  backButton: {
    padding: SPACING.xs,
    marginRight: SPACING.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: SUSHI_COLORS.textPrimary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: SUSHI_COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  regionLabel: {
    fontSize: 11,
    color: SUSHI_COLORS.textMuted,
    marginBottom: 4,
  },
  input: {
    backgroundColor: SUSHI_COLORS.backgroundElevated,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: 16,
    color: SUSHI_COLORS.textPrimary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SUSHI_COLORS.border,
  },
  chipWrap: {
    marginTop: SPACING.sm,
  },
  regionBlock: {
    marginBottom: SPACING.md,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: SUSHI_COLORS.backgroundElevated,
  },
  chipActive: {
    backgroundColor: SUSHI_COLORS.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: SUSHI_COLORS.textSecondary,
  },
  chipTextActive: {
    color: '#fff',
  },
  hint: {
    fontSize: 12,
    color: SUSHI_COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  saveButton: {
    backgroundColor: SUSHI_COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  addedSection: {
    marginTop: SPACING.lg,
    paddingTop: SPACING.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: SUSHI_COLORS.border,
  },
  addedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: SUSHI_COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  addedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: SUSHI_COLORS.backgroundElevated,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
  },
  addedRowText: {
    flex: 1,
  },
  addedName: {
    fontSize: 15,
    fontWeight: '600',
    color: SUSHI_COLORS.textPrimary,
  },
  addedMeta: {
    fontSize: 12,
    color: SUSHI_COLORS.textMuted,
    marginTop: 2,
  },
  deleteButton: {
    padding: SPACING.sm,
  },
});
