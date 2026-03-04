#!/usr/bin/env python3
"""
fetch_season_calendars.py - 自治体・市場の「旬の魚カレンダー」を複数ソースから収集し、
魚種 → 旬の月(1〜12) を抽出。ソースごとに地域タグ（北/東/西/南）を付与する。

使い方:
  # ソース一覧に基づき手動で登録した旬データをマージ（スクレイプはサイト構造により要カスタム）
  python fetch_season_calendars.py --sources data/season_calendar_sources.json --out data/out/season_by_region.json

  # 手動入力の旬データ（JSON）を読み込んで地域タグ付きで出力
  python fetch_season_calendars.py --input data/raw/season_manual.json --out data/out/season_by_region.json

データ形式（入力）:
  [{"sourceId": "hokkaido_pref", "fish": "サケ", "months": [9, 10, 11]}, ...]

データ形式（出力）:
  {"sources": [...], "seasonByFish": [{"name": "サケ", "region": "北", "months": [9,10,11], "source": "...", "sourceUrl": "..."}, ...]}
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

# 地域タグ
REGIONS = ("北", "東", "西", "南")


def load_sources(sources_path: Path) -> list[dict[str, Any]]:
    with open(sources_path, encoding="utf-8") as f:
        return json.load(f)


def merge_months(month_lists: list[list[int]]) -> list[int]:
    """複数ソースで同じ魚の旬月がズレる場合: 最頻月＋前後1ヶ月の和集合。"""
    if not month_lists:
        return []
    all_months: set[int] = set()
    for months in month_lists:
        for m in months:
            if 1 <= m <= 12:
                all_months.add(m)
                all_months.add((m - 2) % 12 + 1)  # 前月
                all_months.add((m % 12) + 1)      # 翌月
    return sorted([m for m in all_months if 1 <= m <= 12])


def main() -> None:
    ap = argparse.ArgumentParser(description="旬カレンダーソースから地域別旬データを出力")
    ap.add_argument("--sources", type=Path, default=Path("data/season_calendar_sources.json"), help="ソース一覧 JSON")
    ap.add_argument("--input", type=Path, help="手動入力の旬データ（魚→月のリスト）")
    ap.add_argument("--out", type=Path, default=Path("data/out/season_by_region.json"), help="出力 JSON")
    args = ap.parse_args()

    sources = load_sources(args.sources) if args.sources.exists() else []
    source_by_id = {s["id"]: s for s in sources}

    if args.input and args.input.exists():
        with open(args.input, encoding="utf-8") as f:
            raw = json.load(f)
        # raw: [{"sourceId": "hokkaido_pref", "fish": "サケ", "months": [9,10,11]}, ...]
        season_by_fish: list[dict[str, Any]] = []
        for r in raw:
            sid = r.get("sourceId", "")
            src = source_by_id.get(sid, {})
            season_by_fish.append({
                "name": r.get("fish", ""),
                "region": src.get("region", "北"),
                "months": r.get("months", []),
                "source": src.get("name", sid),
                "sourceUrl": src.get("url"),
            })
    else:
        # サンプル: ソース一覧だけ出力し、旬データは手動 or 別スクレイプで追加する想定
        season_by_fish = []

    out_data = {
        "sources": sources,
        "seasonByFish": season_by_fish,
        "citations": [{"title": s["name"], "url": s.get("url"), "description": s.get("description")} for s in sources],
    }
    args.out.parent.mkdir(parents=True, exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(out_data, f, ensure_ascii=False, indent=2)

    print(f"Wrote {len(season_by_fish)} season entries to {args.out}")
    if not season_by_fish:
        print("Tip: 旬データは data/raw/season_manual.json に手動で追加するか、各ソース用のスクレイパーを追加してください。", file=sys.stderr)


if __name__ == "__main__":
    main()
