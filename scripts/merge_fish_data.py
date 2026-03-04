#!/usr/bin/env python3
"""
merge_fish_data.py - 名産地（famous_origin.json）・旬（season_by_region.json）・
名前正規化辞書（fish_name_dict.json）をマージし、
魚種ごとに「名産地 Top3〜5」「地域別旬」を統合した fish_season_origin.json を出力する。
出典（e-Stat 表名・旬カレンダー URL）を citations に残す。

使い方:
  python merge_fish_data.py \\
    --famous data/out/famous_origin.json \\
    --season data/out/season_by_region.json \\
    --names data/fish_name_dict.json \\
    --out data/out/fish_season_origin.json
"""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

# 地域タグ（型と一致）
REGIONS = ("北", "東", "西", "南")


def load_json(path: Path) -> Any:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def build_alias_to_canonical(name_dict: list[dict]) -> dict[str, str]:
    """別名 -> 基準名（canonical）のマップ。正規化用。"""
    alias_to_canonical: dict[str, str] = {}
    for item in name_dict:
        canonical = (item.get("name") or "").strip()
        if not canonical:
            continue
        alias_to_canonical[canonical] = canonical
        for a in item.get("aliases") or []:
            a = (a or "").strip()
            if a:
                alias_to_canonical[a] = canonical
    return alias_to_canonical


def normalize_fish_name(name: str, alias_map: dict[str, str]) -> str:
    """魚名を辞書で正規化。マッチしなければそのまま返す。"""
    name = (name or "").strip()
    return alias_map.get(name, name)


def main() -> None:
    ap = argparse.ArgumentParser(description="名産地・旬・名前辞書をマージして最終JSONを出力")
    ap.add_argument("--famous", type=Path, default=Path("data/out/famous_origin.json"), help="名産地 JSON")
    ap.add_argument("--season", type=Path, default=Path("data/out/season_by_region.json"), help="地域別旬 JSON")
    ap.add_argument("--names", type=Path, default=Path("data/fish_name_dict.json"), help="名前正規化辞書")
    ap.add_argument("--out", type=Path, default=Path("data/out/fish_season_origin.json"), help="出力 JSON")
    args = ap.parse_args()

    alias_to_canonical: dict[str, str] = {}
    if args.names.exists():
        name_dict = load_json(args.names)
        alias_to_canonical = build_alias_to_canonical(name_dict)

    # 名産地: species[].name, famousOrigin
    famous_species: dict[str, dict] = {}
    citations: list[dict[str, Any]] = []
    if args.famous.exists():
        famous_data = load_json(args.famous)
        for s in famous_data.get("species") or []:
            name = (s.get("name") or "").strip()
            if not name:
                continue
            famous_species[name] = {
                "name": name,
                "famousOrigin": s.get("famousOrigin"),
                "aliases": [],
                "season": [],
            }
        for c in famous_data.get("citations") or []:
            citations.append({"title": c.get("title", ""), "url": c.get("url"), "description": c.get("description")})

    # 旬: 魚名を正規化して canonical にマージ
    if args.season.exists():
        season_data = load_json(args.season)
        for entry in season_data.get("seasonByFish") or []:
            raw_name = (entry.get("name") or "").strip()
            canonical = normalize_fish_name(raw_name, alias_to_canonical)
            months = entry.get("months") or []
            if not months:
                continue
            region = entry.get("region") or "北"
            if region not in REGIONS:
                region = "北"
            season_item = {
                "months": months,
                "region": region,
                "source": entry.get("source", ""),
                "sourceUrl": entry.get("sourceUrl"),
            }
            if canonical not in famous_species:
                famous_species[canonical] = {
                    "name": canonical,
                    "famousOrigin": None,
                    "aliases": [raw_name] if raw_name != canonical else [],
                    "season": [],
                }
            if season_item not in famous_species[canonical]["season"]:
                famous_species[canonical]["season"].append(season_item)
        for c in season_data.get("citations") or []:
            if not any(c.get("url") == x.get("url") for x in citations):
                citations.append({"title": c.get("title", ""), "url": c.get("url"), "description": c.get("description")})

    # 名前辞書の aliases を canonical に反映（既存 species に追加）
    if args.names.exists():
        name_dict = load_json(args.names)
        for item in name_dict:
            canonical = (item.get("name") or "").strip()
            if not canonical:
                continue
            if canonical not in famous_species:
                famous_species[canonical] = {
                    "name": canonical,
                    "famousOrigin": None,
                    "aliases": list(item.get("aliases") or []),
                    "season": [],
                }
            else:
                existing_aliases = set(famous_species[canonical].get("aliases") or [])
                for a in item.get("aliases") or []:
                    a = (a or "").strip()
                    if a and a != canonical:
                        existing_aliases.add(a)
                famous_species[canonical]["aliases"] = sorted(existing_aliases)

    species_list: list[dict[str, Any]] = []
    for name, data in sorted(famous_species.items()):
        entry = {
            "name": data["name"],
        }
        if data.get("famousOrigin"):
            entry["famousOrigin"] = data["famousOrigin"]
        if data.get("season"):
            entry["season"] = data["season"]
        if data.get("aliases"):
            entry["aliases"] = data["aliases"]
        species_list.append(entry)

    result = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "species": species_list,
        "citations": citations,
    }

    args.out.parent.mkdir(parents=True, exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"Wrote {len(species_list)} species to {args.out}")


if __name__ == "__main__":
    main()
