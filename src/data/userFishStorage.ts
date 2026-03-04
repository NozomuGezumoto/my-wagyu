// ============================================
// ユーザー追加の魚介データ（AsyncStorage）
// ============================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserAddedFish } from '../types';

const STORAGE_KEY = '@my_fish_user_added';

export async function getUserAddedFish(): Promise<UserAddedFish[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as UserAddedFish[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function setUserAddedFish(entries: UserAddedFish[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export async function addUserAddedFish(entry: Omit<UserAddedFish, 'addedAt'>): Promise<void> {
  const list = await getUserAddedFish();
  const newEntry: UserAddedFish = {
    ...entry,
    name: entry.name.trim(),
    addedAt: new Date().toISOString(),
  };
  if (!newEntry.name) return;
  list.push(newEntry);
  await setUserAddedFish(list);
}

export async function removeUserAddedFish(index: number): Promise<void> {
  const list = await getUserAddedFish();
  if (index < 0 || index >= list.length) return;
  list.splice(index, 1);
  await setUserAddedFish(list);
}

export async function removeUserAddedFishByNameAndPref(name: string, prefecture?: string): Promise<void> {
  const list = await getUserAddedFish();
  const next = list.filter((e) => {
    if (e.name !== name) return true;
    if (!prefecture) return false;
    const prefs = e.prefectures ?? [];
    return !prefs.includes(prefecture);
  });
  await setUserAddedFish(next);
}
