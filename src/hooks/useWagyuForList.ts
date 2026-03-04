// ============================================
// 一覧・地図で使うブランド牛データのフック
// ============================================

import { useMemo } from 'react';
import type { WagyuBrand } from '../types';
import {
  getWagyuBrandsForList,
  getPrefectureToWagyuList,
} from '../data/wagyuData';

/** 一覧用：全ブランド牛リスト */
export function useWagyuBrandsForList(): WagyuBrand[] {
  return useMemo(() => getWagyuBrandsForList(), []);
}

/** 地図用：都道府県 → ブランド名リスト */
export function usePrefectureToWagyu() {
  return useMemo(() => getPrefectureToWagyuList(), []);
}
