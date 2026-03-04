// ============================================
// 県別・魚介ごとの写真と評価（AsyncStorage + 画像は documentDirectory）
// ============================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import type { PrefectureFishPhotoRating } from '../types';

const STORAGE_KEY = '@my_fish_photo_ratings';
const MAX_PHOTOS = 4;

function storageKey(prefecture: string, fishName: string): string {
  return `${prefecture}|${fishName}`;
}

export async function getAllPhotoRatings(): Promise<PrefectureFishPhotoRating[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PrefectureFishPhotoRating[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** 写真・星・コメントのいずれかがあるものだけ返す */
export async function getPhotoRatingsWithContent(): Promise<PrefectureFishPhotoRating[]> {
  const all = await getAllPhotoRatings();
  return all.filter(
    (e) =>
      e.photoUris.length > 0 ||
      (e.rating != null && e.rating >= 1) ||
      (e.comment != null && e.comment.trim() !== '')
  );
}

async function setAllPhotoRatings(entries: PrefectureFishPhotoRating[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function findByKey(entries: PrefectureFishPhotoRating[], prefecture: string, fishName: string): number {
  return entries.findIndex((e) => e.prefecture === prefecture && e.fishName === fishName);
}

export async function getPhotoRating(prefecture: string, fishName: string): Promise<PrefectureFishPhotoRating | null> {
  const entries = await getAllPhotoRatings();
  const i = findByKey(entries, prefecture, fishName);
  return i >= 0 ? entries[i]! : null;
}

export async function getPhotoRatingsForFish(
  fishName: string,
  prefectures: string[]
): Promise<Map<string, PrefectureFishPhotoRating>> {
  const entries = await getAllPhotoRatings();
  const map = new Map<string, PrefectureFishPhotoRating>();
  for (const pref of prefectures) {
    const i = findByKey(entries, pref, fishName);
    if (i >= 0) map.set(pref, entries[i]!);
  }
  return map;
}

/** 画像をピックして documentDirectory にコピーし、URI を返す */
export async function pickAndSavePhoto(): Promise<string | null> {
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
  const filename = `fish_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
  const destUri = `${dir}${filename}`;
  try {
    await FileSystem.copyAsync({ from: sourceUri, to: destUri });
    return destUri;
  } catch {
    return null;
  }
}

export async function addPhoto(
  prefecture: string,
  fishName: string,
  newPhotoUri: string
): Promise<PrefectureFishPhotoRating | null> {
  const entries = await getAllPhotoRatings();
  let i = findByKey(entries, prefecture, fishName);
  if (i < 0) {
    const newEntry: PrefectureFishPhotoRating = {
      prefecture,
      fishName,
      photoUris: [],
      rating: undefined,
    };
    entries.push(newEntry);
    i = entries.length - 1;
  }
  const entry = entries[i]!;
  if (entry.photoUris.length >= MAX_PHOTOS) return entry;
  entry.photoUris = [...entry.photoUris, newPhotoUri];
  await setAllPhotoRatings(entries);
  return entry;
}

export async function removePhoto(
  prefecture: string,
  fishName: string,
  photoUri: string
): Promise<void> {
  const entries = await getAllPhotoRatings();
  const i = findByKey(entries, prefecture, fishName);
  if (i < 0) return;
  const entry = entries[i]!;
  entry.photoUris = entry.photoUris.filter((u) => u !== photoUri);
  const hasOtherData = entry.photoUris.length > 0 || entry.rating !== undefined || (entry.comment != null && entry.comment.trim() !== '');
  if (!hasOtherData) {
    entries.splice(i, 1);
  }
  await setAllPhotoRatings(entries);
  try {
    await FileSystem.deleteAsync(photoUri, { idempotent: true });
  } catch {
    // ignore
  }
}

export async function setRating(
  prefecture: string,
  fishName: string,
  rating: number
): Promise<PrefectureFishPhotoRating> {
  const entries = await getAllPhotoRatings();
  let i = findByKey(entries, prefecture, fishName);
  if (i < 0) {
    const newEntry: PrefectureFishPhotoRating = {
      prefecture,
      fishName,
      photoUris: [],
      rating,
    };
    entries.push(newEntry);
    await setAllPhotoRatings(entries);
    return newEntry;
  }
  const entry = entries[i]!;
  entry.rating = Math.min(5, Math.max(1, rating));
  await setAllPhotoRatings(entries);
  return entry;
}

export async function setComment(
  prefecture: string,
  fishName: string,
  comment: string
): Promise<PrefectureFishPhotoRating> {
  const entries = await getAllPhotoRatings();
  let i = findByKey(entries, prefecture, fishName);
  if (i < 0) {
    const newEntry: PrefectureFishPhotoRating = {
      prefecture,
      fishName,
      photoUris: [],
      rating: undefined,
      comment: comment.trim() || undefined,
    };
    entries.push(newEntry);
    await setAllPhotoRatings(entries);
    return newEntry;
  }
  const entry = entries[i]!;
  entry.comment = comment.trim() || undefined;
  await setAllPhotoRatings(entries);
  return entry;
}

export { MAX_PHOTOS };
