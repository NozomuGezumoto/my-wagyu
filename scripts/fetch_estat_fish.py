#!/usr/bin/env python3
"""
fetch_estat_fish.py - e-Stat から「魚種別×都道府県別」漁獲量を取得し、
魚種ごとに都道府県を数量で集計して Top3〜Top5 を名産地として出力する。

使い方:
  # 単年: Excel を手動ダウンロードした場合
  python fetch_estat_fish.py --excel data/raw/estat_gyoshu_todoufuken_r5.xlsx --year 2023 --top 5 --out data/out/famous_origin.json

  # 複数年の Excel が同じディレクトリにある場合（直近3〜5年平均）
  python fetch_estat_fish.py --excel-dir data/raw/estat_fish --years 2021,2022,2023 --top 5 --out data/out/famous_origin.json

  # e-Stat から直接ダウンロード（stat_inf_id を指定。年度ごとにIDが変わる）
  python fetch_estat_fish.py --download 000040260797 --year 2023 --top 5 --out data/out/famous_origin.json

e-Stat 表: 海面漁業生産統計調査 確報 「大海区都道府県振興局別統計 魚種別漁獲量」（表番号 2-2）
出典: https://www.e-stat.go.jp/stat-search/files?toukei=00500216&tstat=000001015174

依存: pip install pandas openpyxl requests
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

try:
    import pandas as pd
except ImportError:
    print("pip install pandas openpyxl を実行してください", file=sys.stderr)
    sys.exit(1)

# 都道府県名の正規化（表の「〇〇県」「北海道」などに揃える）
PREFECTURES_OFFICIAL = [
    "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
    "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
    "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県",
    "岐阜県", "静岡県", "愛知県", "三重県",
    "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県",
    "鳥取県", "島根県", "岡山県", "広島県", "山口県",
    "徳島県", "香川県", "愛媛県", "高知県",
    "福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
]
PREF_SET = set(PREFECTURES_OFFICIAL)

# 数量として解釈する列のパターン（トン、t 等）
QUANTITY_PATTERN = re.compile(r"(生産量|漁獲量|数量|トン|t)$", re.I)


def normalize_prefecture(s: str) -> str | None:
    s = (s or "").strip()
    if not s:
        return None
    if s in PREF_SET:
        return s
    for p in PREFECTURES_OFFICIAL:
        if p in s or s.startswith(p.replace("県", "").replace("府", "").replace("都", "")):
            return p
    return None


def is_quantity_column(col: str) -> bool:
    if pd.isna(col):
        return False
    return bool(QUANTITY_PATTERN.search(str(col))) or str(col).replace(" ", "").isdigit()


def find_fish_and_prefecture_columns(df: pd.DataFrame) -> tuple[str | None, str | None, str | None]:
    """DataFrame から 魚種・都道府県・数量 の列名を推測する。"""
    cols = [str(c).strip() for c in df.columns]
    fish_col = None
    pref_col = None
    value_col = None

    for c in cols:
        if "魚種" in c or ("魚" in c and "種" in c):
            fish_col = c
        if "都道府県" in c or "地域" in c or "振興局" in c or c in PREF_SET:
            pref_col = c
        if is_quantity_column(c):
            value_col = c

    if not fish_col and len(cols) >= 1:
        sample = df.iloc[:10, 0].dropna().astype(str)
        if sample.str.replace(r"\s", "", regex=True).str.isdigit().any():
            value_col = cols[0]
        elif any(normalize_prefecture(v) for v in sample):
            pref_col = cols[0]
        else:
            fish_col = cols[0]
    if not pref_col and len(cols) >= 2:
        sample = df.iloc[:10, 1].dropna().astype(str)
        if any(normalize_prefecture(v) for v in sample):
            pref_col = cols[1]
        elif not fish_col:
            fish_col = cols[1]
    if not value_col:
        for c in cols:
            if df[c].dtype in ("int64", "float64") and df[c].notna().any():
                value_col = c
                break

    return fish_col, pref_col, value_col


def load_single_excel(path: Path) -> pd.DataFrame:
    """1つの Excel を読み、魚種×都道府県×数量 の行を返す。"""
    xl = pd.ExcelFile(path)
    all_rows = []

    for sheet_name in xl.sheet_names:
        df = pd.read_excel(path, sheet_name=sheet_name, header=None)
        if df.empty or df.shape[1] < 2:
            continue
        header_row = 0
        for i in range(min(5, len(df))):
            row = df.iloc[i].astype(str)
            if any("魚種" in v or "都道府県" in v or "漁獲量" in v for v in row):
                header_row = i
                break
        df = pd.read_excel(path, sheet_name=sheet_name, header=header_row)
        df = df.dropna(how="all").reset_index(drop=True)

        fish_col, pref_col, value_col = find_fish_and_prefecture_columns(df)
        if not value_col:
            for c in df.columns:
                if pd.api.types.is_numeric_dtype(df[c]) and df[c].notna().any():
                    value_col = c
                    break
        if not value_col:
            continue

        if fish_col and pref_col:
            for _, row in df.iterrows():
                fish = row.get(fish_col)
                pref = row.get(pref_col)
                val = row.get(value_col)
                if pd.isna(fish) or pd.isna(val):
                    continue
                fish = str(fish).strip()
                if not fish or fish.startswith("計") or fish == "魚種":
                    continue
                pref_n = normalize_prefecture(str(pref)) if pd.notna(pref) else None
                if pref_n:
                    try:
                        v = float(val)
                    except (TypeError, ValueError):
                        continue
                    all_rows.append({"fish": fish, "prefecture": pref_n, "value": v})
        else:
            fish_col = fish_col or df.columns[0]
            for _, row in df.iterrows():
                fish = row.get(fish_col)
                if pd.isna(fish):
                    continue
                fish = str(fish).strip()
                if not fish or fish.startswith("計") or fish == "魚種":
                    continue
                for c in df.columns:
                    if c == fish_col:
                        continue
                    if normalize_prefecture(str(c)):
                        try:
                            v = float(row[c])
                        except (TypeError, ValueError):
                            continue
                        if pd.notna(v) and v > 0:
                            all_rows.append({"fish": fish, "prefecture": str(c).strip(), "value": v})

    if not all_rows:
        return pd.DataFrame()
    return pd.DataFrame(all_rows)


def aggregate_by_fish(df: pd.DataFrame) -> dict[str, list[tuple[str, float]]]:
    """魚種ごとに都道府県の数量を集計し、数量降順のリストを返す。"""
    agg = df.groupby(["fish", "prefecture"])["value"].sum().reset_index()
    by_fish: dict[str, list[tuple[str, float]]] = {}
    for fish, pref, val in zip(agg["fish"], agg["prefecture"], agg["value"]):
        by_fish.setdefault(fish, []).append((pref, val))
    for fish in by_fish:
        by_fish[fish] = sorted(by_fish[fish], key=lambda x: -x[1])
    return by_fish


def top_n_prefectures(by_fish: dict[str, list[tuple[str, float]]], top: int) -> dict[str, list[str]]:
    """魚種ごとに上位 top 件の都道府県名リストを返す。"""
    return {fish: [p for p, _ in prefs[:top]] for fish, prefs in by_fish.items()}


def download_estat_file(stat_inf_id: str, out_path: Path) -> bool:
    """e-Stat のファイルダウンロード（statInfId で Excel を取得）。"""
    try:
        import urllib.request
        url = f"https://www.e-stat.go.jp/stat-search/file-download?statInfId={stat_inf_id}&fileKind=0"
        urllib.request.urlretrieve(url, out_path)
        return out_path.exists()
    except Exception as e:
        print(f"Download error: {e}", file=sys.stderr)
        return False


def main() -> None:
    ap = argparse.ArgumentParser(description="e-Stat 魚種別都道府県別漁獲量から名産地 TopN を算出")
    ap.add_argument("--excel", type=Path, help="単一の Excel ファイルパス")
    ap.add_argument("--excel-dir", type=Path, help="複数年の Excel が入ったディレクトリ")
    ap.add_argument("--download", type=str, help="e-Stat の statInfId でダウンロード")
    ap.add_argument("--year", type=str, help="集計年（表示用、例: 2023）")
    ap.add_argument("--years", type=str, help="複数年の平均（カンマ区切り、例: 2021,2022,2023）")
    ap.add_argument("--top", type=int, default=5, help="名産地として出す都道府県数 (default: 5)")
    ap.add_argument("--out", type=Path, default=Path("data/out/famous_origin.json"), help="出力 JSON パス")
    args = ap.parse_args()

    if args.download:
        raw_dir = Path("data/raw")
        raw_dir.mkdir(parents=True, exist_ok=True)
        year_suffix = args.year or "r5"
        excel_path = raw_dir / f"estat_gyoshu_todoufuken_{year_suffix}.xlsx"
        if not download_estat_file(args.download, excel_path):
            sys.exit(1)
        args.excel = excel_path

    if not args.excel and not args.excel_dir:
        print("--excel または --excel-dir または --download を指定してください", file=sys.stderr)
        sys.exit(1)

    all_dfs: list[pd.DataFrame] = []
    if args.excel:
        if not args.excel.exists():
            print(f"File not found: {args.excel}", file=sys.stderr)
            sys.exit(1)
        df = load_single_excel(args.excel)
        if df.empty:
            print("No 魚種×都道府県 の行を検出しました。Excel のレイアウトを確認してください。", file=sys.stderr)
            sys.exit(1)
        all_dfs.append(df)
    else:
        for f in sorted(args.excel_dir.iterdir()):
            if f.suffix.lower() in (".xlsx", ".xls"):
                df = load_single_excel(f)
                if not df.empty:
                    all_dfs.append(df)
        if not all_dfs:
            print("No Excel files or no data found.", file=sys.stderr)
            sys.exit(1)

    combined = pd.concat(all_dfs, ignore_index=True)
    if args.years and len(all_dfs) > 1:
        combined = combined.groupby(["fish", "prefecture"])["value"].mean().reset_index()
    by_fish = aggregate_by_fish(combined)
    top_prefs = top_n_prefectures(by_fish, args.top)

    survey_year = args.years or (args.year or "単年")
    source = "海面漁業生産統計調査 確報 大海区都道府県振興局別統計 魚種別漁獲量（表番号2-2）"
    source_url = "https://www.e-stat.go.jp/stat-search/files?toukei=00500216&tstat=000001015174"

    result: list[dict[str, Any]] = []
    for fish, prefs in sorted(top_prefs.items()):
        result.append({
            "name": fish,
            "famousOrigin": {
                "prefectures": prefs,
                "surveyYear": survey_year,
                "source": source,
                "sourceUrl": source_url,
            },
        })

    args.out.parent.mkdir(parents=True, exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump({"species": result, "citations": [{"title": source, "url": source_url}]}, f, ensure_ascii=False, indent=2)

    print(f"Wrote {len(result)} species to {args.out}")


if __name__ == "__main__":
    main()
