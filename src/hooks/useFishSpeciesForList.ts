// ============================================
// 一覧・地図で使う「ベース + ユーザー追加」データのフック
// ============================================

import { useCallback, useEffect, useState } from 'react';
import type { FishSpecies, UserAddedFish } from '../types';
import { getFishSpeciesForList, getPrefectureToFishWithSeason } from '../data/fishData';
import {
  getUserAddedFish,
  addUserAddedFish as addStorage,
  removeUserAddedFish as removeStorage,
} from '../data/userFishStorage';

export function useUserFishData() {
  const [userAdded, setUserAdded] = useState<UserAddedFish[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const list = await getUserAddedFish();
    setUserAdded(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addFish = useCallback(async (entry: Omit<UserAddedFish, 'addedAt'>) => {
    await addStorage(entry);
    await load();
  }, [load]);

  const removeFish = useCallback(async (index: number) => {
    await removeStorage(index);
    await load();
  }, [load]);

  return { userAdded, loading, addFish, removeFish, refresh: load };
}

/** 一覧用：ベース + ユーザー追加をマージした魚種リスト */
export function useFishSpeciesForList(): {
  species: FishSpecies[];
  userAdded: UserAddedFish[];
  loading: boolean;
  addFish: (entry: Omit<UserAddedFish, 'addedAt'>) => Promise<void>;
  removeFish: (index: number) => Promise<void>;
  refresh: () => Promise<void>;
} {
  const { userAdded, loading, addFish, removeFish, refresh } = useUserFishData();
  const species = getFishSpeciesForList(userAdded);
  return { species, userAdded, loading, addFish, removeFish, refresh };
}

/** 地図用：ベース + ユーザー追加をマージした 都道府県→魚+旬 */
export function usePrefectureToFishWithSeason() {
  const { userAdded, loading } = useUserFishData();
  const map = getPrefectureToFishWithSeason(userAdded);
  return { prefectureToFish: map, userAdded, loading };
}
