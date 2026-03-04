// ============================================
// 県別・ブランド牛ごとの写真・星・コメント・部位・格付け（AsyncStorage + documentDirectory）
// ============================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import type { PrefectureWagyuPhotoRating } from '../types';

const STORAGE_KEY = '@my_wagyu_photo_ratings';
const MAX_PHOTOS = 4;

function storageKey(prefecture: string, wagyuName: string): string {
  return `${prefecture}|${wagyuName}`;
}

export async function getAllWagyuRatings(): Promise<PrefectureWagyuPhotoRating[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PrefectureWagyuPhotoRating[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** 写真・星・コメントのいずれかがあるものだけ返す */
export async function getWagyuRatingsWithContent(): Promise<PrefectureWagyuPhotoRating[]> {
  const all = await getAllWagyuRatings();
  return all.filter(
    (e) =>
      e.photoUris.length > 0 ||
      (e.rating != null && e.rating >= 1) ||
      (e.comment != null && e.comment.trim() !== '') ||
      (e.cutMemo != null && e.cutMemo.trim() !== '') ||
      (e.gradeMemo != null && e.gradeMemo.trim() !== '')
  );
}

async function setAllWagyuRatings(entries: PrefectureWagyuPhotoRating[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function findByKey(
  entries: PrefectureWagyuPhotoRating[],
  prefecture: string,
  wagyuName: string
): number {
  return entries.findIndex((e) => e.prefecture === prefecture && e.wagyuName === wagyuName);
}

export async function getWagyuRating(
  prefecture: string,
  wagyuName: string
): Promise<PrefectureWagyuPhotoRating | null> {
  const entries = await getAllWagyuRatings();
  const i = findByKey(entries, prefecture, wagyuName);
  return i >= 0 ? entries[i]! : null;
}

export async function getWagyuRatingsForBrand(
  wagyuName: string,
  prefectures: string[]
): Promise<Map<string, PrefectureWagyuPhotoRating>> {
  const entries = await getAllWagyuRatings();
  const map = new Map<string, PrefectureWagyuPhotoRating>();
  for (const pref of prefectures) {
    const i = findByKey(entries, pref, wagyuName);
    if (i >= 0) map.set(pref, entries[i]!);
  }
  return map;
}

export async function pickAndSaveWagyuPhoto(): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') return null;
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.8,
  });
  if (result.canceled || !result.assets[0]?.uri) return null;
  const sourceUri = result.assets[0].uri;
  const dir = FileSystem.documentDirectory;
  if (!dir) return null;
  const filename = `wagyu_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
  const destUri = `${dir}${filename}`;
  try {
    await FileSystem.copyAsync({ from: sourceUri, to: destUri });
    return destUri;
  } catch {
    return null;
  }
}

export async function addWagyuPhoto(
  prefecture: string,
  wagyuName: string,
  newPhotoUri: string
): Promise<PrefectureWagyuPhotoRating | null> {
  const entries = await getAllWagyuRatings();
  let i = findByKey(entries, prefecture, wagyuName);
  if (i < 0) {
    const newEntry: PrefectureWagyuPhotoRating = {
      prefecture,
      wagyuName,
      photoUris: [],
      rating: undefined,
    };
    entries.push(newEntry);
    i = entries.length - 1;
  }
  const entry = entries[i]!;
  if (entry.photoUris.length >= MAX_PHOTOS) return entry;
  entry.photoUris = [...entry.photoUris, newPhotoUri];
  await setAllWagyuRatings(entries);
  return entry;
}

export async function removeWagyuPhoto(
  prefecture: string,
  wagyuName: string,
  photoUri: string
): Promise<void> {
  const entries = await getAllWagyuRatings();
  const i = findByKey(entries, prefecture, wagyuName);
  if (i < 0) return;
  const entry = entries[i]!;
  entry.photoUris = entry.photoUris.filter((u) => u !== photoUri);
  const hasOtherData =
    entry.photoUris.length > 0 ||
    entry.rating !== undefined ||
    (entry.comment != null && entry.comment.trim() !== '') ||
    (entry.cutMemo != null && entry.cutMemo.trim() !== '') ||
    (entry.gradeMemo != null && entry.gradeMemo.trim() !== '');
  if (!hasOtherData) {
    entries.splice(i, 1);
  }
  await setAllWagyuRatings(entries);
  try {
    await FileSystem.deleteAsync(photoUri, { idempotent: true });
  } catch {
    // ignore
  }
}

export async function setWagyuRating(
  prefecture: string,
  wagyuName: string,
  rating: number
): Promise<PrefectureWagyuPhotoRating> {
  const entries = await getAllWagyuRatings();
  let i = findByKey(entries, prefecture, wagyuName);
  if (i < 0) {
    const newEntry: PrefectureWagyuPhotoRating = {
      prefecture,
      wagyuName,
      photoUris: [],
      rating,
    };
    entries.push(newEntry);
    await setAllWagyuRatings(entries);
    return newEntry;
  }
  const entry = entries[i]!;
  entry.rating = Math.min(5, Math.max(1, rating));
  await setAllWagyuRatings(entries);
  return entry;
}

export async function setWagyuComment(
  prefecture: string,
  wagyuName: string,
  comment: string
): Promise<PrefectureWagyuPhotoRating> {
  const entries = await getAllWagyuRatings();
  let i = findByKey(entries, prefecture, wagyuName);
  if (i < 0) {
    const newEntry: PrefectureWagyuPhotoRating = {
      prefecture,
      wagyuName,
      photoUris: [],
      comment: comment.trim() || undefined,
    };
    entries.push(newEntry);
    await setAllWagyuRatings(entries);
    return newEntry;
  }
  const entry = entries[i]!;
  entry.comment = comment.trim() || undefined;
  await setAllWagyuRatings(entries);
  return entry;
}

export async function setWagyuCutMemo(
  prefecture: string,
  wagyuName: string,
  cutMemo: string
): Promise<PrefectureWagyuPhotoRating> {
  const entries = await getAllWagyuRatings();
  let i = findByKey(entries, prefecture, wagyuName);
  if (i < 0) {
    const newEntry: PrefectureWagyuPhotoRating = {
      prefecture,
      wagyuName,
      photoUris: [],
      cutMemo: cutMemo.trim() || undefined,
    };
    entries.push(newEntry);
    await setAllWagyuRatings(entries);
    return newEntry;
  }
  const entry = entries[i]!;
  entry.cutMemo = cutMemo.trim() || undefined;
  await setAllWagyuRatings(entries);
  return entry;
}

export async function setWagyuGradeMemo(
  prefecture: string,
  wagyuName: string,
  gradeMemo: string
): Promise<PrefectureWagyuPhotoRating> {
  const entries = await getAllWagyuRatings();
  let i = findByKey(entries, prefecture, wagyuName);
  if (i < 0) {
    const newEntry: PrefectureWagyuPhotoRating = {
      prefecture,
      wagyuName,
      photoUris: [],
      gradeMemo: gradeMemo.trim() || undefined,
    };
    entries.push(newEntry);
    await setAllWagyuRatings(entries);
    return newEntry;
  }
  const entry = entries[i]!;
  entry.gradeMemo = gradeMemo.trim() || undefined;
  await setAllWagyuRatings(entries);
  return entry;
}

export { MAX_PHOTOS };
