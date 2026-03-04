# 魚データ（名産地・旬）パイプライン

日本の「魚の種類」「名産地（都道府県）」「旬（月）」を、信頼できる公開情報から取得し、アプリで利用する形にまとめます。

---

## 最初にやること（3ステップ）

**何から手を付ければいいか迷ったら、この順でやってください。**

### ステップ 0: Python を用意する

ターミナルで次を実行して、Python が動くか確認する。

```powershell
python --version
```

`python` で動かない場合は `py --version` を試す。どちらもダメなら [python.org](https://www.python.org/downloads/) から Python をインストールする。

### ステップ 1: いちばん簡単なテスト（名産地なし・旬だけ）

**e-Stat の Excel は使わず、すでに入れてある旬のサンプルデータで「パイプラインが動くか」だけ確認する。**

プロジェクトのフォルダで:

```powershell
cd c:\My_Apps\Project_My_Fish
python -m pip install -q pandas openpyxl
.\scripts\run_fish_data_pipeline.ps1 -SkipFamous
```

- `data/out/fish_season_origin.json` ができていれば成功。
- 中身をさっと見る: `Get-Content data\out\fish_season_origin.json -Head 30`

ここまでできたら「データの流れ」は動いている。

### ステップ 2: 名産地データも入れたい場合

1. ブラウザで [e-Stat 海面漁業生産統計 ファイル一覧](https://www.e-stat.go.jp/stat-search/files?toukei=00500216&tstat=000001015174) を開く。
2. **「令和５年漁業・養殖業生産統計」** を開き、**「大海区都道府県振興局別統計 魚種別漁獲量」** の **EXCEL** をダウンロード。
3. ダウンロードしたファイルを **`c:\My_Apps\Project_My_Fish\data\raw\`** に移動し、名前を **`estat_gyoshu_todoufuken_r5.xlsx`** に変更（または `estat_` で始まる名前でOK）。
4. もう一度パイプラインを実行（今度は名産地も含む）:

```powershell
.\scripts\run_fish_data_pipeline.ps1
```

### ステップ 3: アプリで使う

生成したデータをアプリの `src/data/` にコピーする。

```powershell
.\scripts\run_fish_data_pipeline.ps1 -CopyToApp
```

または手動で:

```powershell
Copy-Item data\out\fish_season_origin.json src\data\
```

---

## 目的

- **名産地**: e-Stat（政府統計）の「漁業・養殖業生産統計」から魚種別×都道府県別の数量を集計し、Top3〜Top5 を算出。
- **旬**: 自治体・市場の「旬の魚カレンダー」を複数ソースから収集し、魚種→旬の月(1〜12) を地域タグ（北/東/西/南）付きで保持。
- **名前揺れ対策**: e-Stat の魚名と旬カレンダー側の表記（別名・ひらがな/カタカナ等）を正規化する辞書で統合。

## ディレクトリ構成

```
data/
  fish_name_dict.json      # 名前正規化辞書（基準名 → 別名リスト）
  season_calendar_sources.json  # 旬カレンダーソース一覧（URL・地域タグ）
  raw/                     # 取得した生データ
    estat_*.xlsx           # e-Stat からダウンロードした Excel（手動 or スクリプト）
    season_manual.json     # 旬の手動入力データ（ソースID・魚名・月）
  out/                     # パイプライン出力
    famous_origin.json     # 魚種ごと名産地 TopN（e-Stat 由来）
    season_by_region.json  # 地域別旬（旬カレンダー由来）
    fish_season_origin.json # 統合成果物（アプリ用）
```

アプリ側では **`src/data/prefecture_fish.json`** に 47 都道府県×魚介のベースデータを置き、地図で同じ粒度のピン表示に利用。e-Stat の名産地データがあればマージされる。

## 出典（アプリの出典表示用）

### 名産地

- **統計名**: 海面漁業生産統計調査 確報  
  **表**: 大海区都道府県振興局別統計 魚種別漁獲量（表番号 2-2）
- **URL**: https://www.e-stat.go.jp/stat-search/files?toukei=00500216&tstat=000001015174
- **提供**: 農林水産省

### 旬

- 北海道お魚図鑑（北海道庁）: https://www.pref.hokkaido.lg.jp/sr/gid/sr_ske_index.html
- 岩内町 魚カレンダー: https://www.iwanai-kanko.org/?page_id=1089
- 高槻商店 旬の魚カレンダー: https://www.takatsuki-shoten.co.jp/calendar.html  
（他ソースは `season_calendar_sources.json` に追加）

## 実行手順

### 1. 名産地データ（e-Stat）

**オプション A: 手動で Excel をダウンロード**

1. [e-Stat 海面漁業生産統計 ファイル一覧](https://www.e-stat.go.jp/stat-search/files?toukei=00500216&tstat=000001015174) を開く。
2. 対象年（例: 令和５年漁業・養殖業生産統計）→ 「大海区都道府県振興局別統計 魚種別漁獲量」の **EXCEL** をダウンロード。
3. `data/raw/` に保存（例: `estat_gyoshu_todoufuken_r5.xlsx`）。

```powershell
cd scripts
python fetch_estat_fish.py --excel ../data/raw/estat_gyoshu_todoufuken_r5.xlsx --year 2023 --top 5 --out ../data/out/famous_origin.json
```

**オプション B: スクリプトでダウンロード（stat_inf_id を指定）**

年度ごとに e-Stat の表 ID（statInfId）が変わります。一覧ページで「魚種別漁獲量」のダウンロードリンクの `statInfId` を確認してください。

```powershell
python fetch_estat_fish.py --download 000040260797 --year 2023 --top 5 --out ../data/out/famous_origin.json
```

**複数年平均（直近3〜5年）**

複数年の Excel を `data/raw/estat_fish/` に置き、`--years` で指定します。

```powershell
python fetch_estat_fish.py --excel-dir ../data/raw/estat_fish --years 2021,2022,2023 --top 5 --out ../data/out/famous_origin.json
```

### 2. 旬データ

旬カレンダーはサイトごとに HTML 構造が異なるため、まずは手動で `data/raw/season_manual.json` に登録する形を推奨します。

- `data/season_calendar_sources.json` の `id` を `sourceId` に使用。
- `fish`: 魚名（旬カレンダー側の表記でOK。名前辞書で正規化される）
- `months`: 旬の月の配列（1〜12）。

```powershell
python fetch_season_calendars.py --input ../data/raw/season_manual.json --out ../data/out/season_by_region.json
```

### 3. 名前辞書の更新

`data/fish_name_dict.json` に、e-Stat の魚名を `name`、旬カレンダーで出てくる別名を `aliases` に追加します。同じ魚は1エントリにまとめてください。

### 4. マージ（最終成果物）

```powershell
python merge_fish_data.py --famous ../data/out/famous_origin.json --season ../data/out/season_by_region.json --names ../data/fish_name_dict.json --out ../data/out/fish_season_origin.json
```

### 5. アプリへコピー

```powershell
Copy-Item ../data/out/fish_season_origin.json ../src/data/
```

（既存の `copy_data_to_app.ps1` にこのファイルを追加してもよい）

## 成果物の型（TypeScript）

`src/types/index.ts` の `FishSpecies`, `FamousOrigin`, `SeasonByRegion`, `FishSeasonOriginData` を参照してください。

## 注意

- e-Stat の Excel は年度・表によってレイアウトが異なる場合があります。`fetch_estat_fish.py` で列の自動検出に失敗したら、スクリプト内の列名マッピングを調整してください。
- 旬カレンダーのスクレイピングを自動化する場合は、各サイトの利用規約と robots.txt を確認し、負荷をかけないようにしてください。
