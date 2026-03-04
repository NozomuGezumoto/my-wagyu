# 全国ブランド牛制覇（Project My Wagyu）

日本全国のブランド和牛を地図で確認し、産地ごとに写真・評価・メモを記録するアプリです。

## 機能

- 🗺️ 都道府県別のブランド牛一覧・地図表示
- 📍 産地ピン（進捗に応じて金・銀・銅・白の枠）
- 📸 銘柄ごとに県別で写真（最大4枚）・★5評価・コメント・部位メモ・格付けメモ
- 📖 銘柄ごとの説明文（158銘柄）

## 技術スタック

- **Expo (SDK 54)** / React Native
- **expo-router**（ファイルベースルーティング）
- **react-native-maps**（地図・クラスタリング）

## 開発環境

- Node.js 18+
- npm または yarn

```bash
# 依存関係
npm install

# 起動（Expo Go で確認）
npx expo start
```

### Google 地図（Android）

`app.json` の `expo.android.config.googleMaps.apiKey` に、Google Cloud Console で発行した **Maps SDK for Android** の API キーを設定してください。

## バージョン・ビルド番号

| 項目 | 場所 | 説明 |
|------|------|------|
| **version** | `app.json` → `expo.version` | ストアに表示されるバージョン（例: 1.0.0） |
| **iOS buildNumber** | `app.json` → `expo.ios.buildNumber` | ストア提出ごとに増やす（例: 1, 2, 3…） |
| **Android versionCode** | `app.json` → `expo.android.versionCode` | ストア提出ごとに増やす（整数） |

**更新の目安**

- 機能追加・仕様変更 → `version` を上げる（例: 1.0.0 → 1.1.0）
- ストアに新ビルドを提出するたび → `buildNumber` / `versionCode` を 1 ずつ増やす

`eas.json` の `production` で `autoIncrement: true` にしてあるため、EAS Build で本番ビルドするたびにビルド番号が自動で増えます。

## Git に上げる前の確認

```bash
# 不要ファイルが含まれていないか確認
git status

# .gitignore に node_modules, .expo が含まれていること
# 秘密情報（API キー、.env）がコミットされないこと
```

API キーは `app.json` に直接書かず、EAS Secrets や環境変数で渡す運用を推奨します。

## ストア提出用ビルド（EAS Build）

[Expo Application Services (EAS)](https://expo.dev/eas) でビルド・提出できます。

### 1. セットアップ

```bash
npm install -g eas-cli
eas login
eas build:configure
```

### 2. アイコン・スプラッシュ

- **アイコン**: `assets/icon-wagyu.png`（1024x1024 推奨）
- **スプラッシュ**: `assets/images/splash-icon.png`

未設定の場合はビルド時にエラーになるため、用意してからビルドしてください。

### 3. ビルド

```bash
# iOS（実機用）
eas build --platform ios --profile production

# Android（AAB: Play 提出用）
eas build --platform android --profile production

# 両方
eas build --platform all --profile production
```

### 4. ストア提出

```bash
# 直近のビルドを提出
eas submit --platform ios --profile production
eas submit --platform android --profile production
```

`eas.json` の `submit.production` に、Apple ID・App Store Connect の App ID・Android のサービスアカウントキーなどを設定すると、コマンドで提出まで行えます。

## ディレクトリ構成（抜粋）

```
├── app/                 # Expo Router 画面
├── src/
│   ├── components/     # 地図・詳細・一覧など
│   ├── constants/      # テーマ
│   ├── data/           # 銘柄・産地・説明 JSON
│   └── types/
├── assets/              # アイコン・スプラッシュ
├── app.json             # Expo 設定・バージョン
├── eas.json             # EAS Build/Submit 設定
├── package.json
└── README.md
```

## ライセンス

MIT License
