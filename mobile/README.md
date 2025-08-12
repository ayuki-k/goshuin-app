# 御朱印補助アプリ (GoshuinApp)

地名検索で御朱印をもらえる神社・寺院を地図上にマッピングするReact Nativeアプリです。

## 機能

- 🔍 **地名検索**: 都道府県・市区町村での検索
- ⛩️ **神社・寺院フィルター**: 種別での絞り込み
- 🗺️ **地図表示**: 神社・寺院の位置を視覚的にマッピング
- 📝 **リスト表示**: 詳細情報付きのカード形式
- 📍 **位置情報**: 現在地表示対応
- 📿 **御朱印情報**: 御朱印の有無を視覚的に表示

## 開発環境セットアップ

### 必要な環境

#### 共通
- Node.js (v16以上推奨)
- npm または yarn
- React Native CLI

#### iOS開発
- **macOS必須**
- Xcode (Mac App Storeからインストール)
- CocoaPods

#### Android開発
- Java Development Kit (JDK 11以上)
- Android Studio
- Android SDK

### 環境診断
開発環境が正しくセットアップされているか確認：
```bash
npx react-native doctor
```

## iOS開発環境セットアップ

### 1. Xcodeのインストール
```bash
# Mac App Storeから「Xcode」を検索してインストール
# サイズ: 約5-10GB、インストールには時間がかかります
```

### 2. Xcodeコマンドラインツールの設定
```bash
# Xcode開発者ディレクトリを設定
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer

# ライセンスに同意
sudo xcodebuild -license accept
```

### 3. CocoaPodsのインストール
```bash
# Homebrewを使用する場合（推奨）
brew install cocoapods

# または gem を使用する場合
sudo gem install cocoapods
```

### 4. iOSプロジェクトのセットアップと実行

#### 方法1: React Native CLIを使用
```bash
# プロジェクトディレクトリに移動
cd mobile

# iOS依存関係をインストール
cd ios && pod install && cd ..

# Metroサーバーを起動
npm start

# 新しいターミナルでiOSアプリを実行
npm run ios
```

#### 方法2: Xcodeを使用
```bash
# Xcodeワークスペースを開く
open ios/GoshuinApp.xcworkspace
```

Xcodeで：
1. 上部のデバイス選択で「iPhone Simulator」を選択
2. ▶️ボタンを押してビルド＆実行

## Android開発環境セットアップ

### 1. Java Development Kit (JDK) のインストール
```bash
# Homebrewを使用
brew install openjdk@17

# パスを設定
echo 'export PATH="/usr/local/opt/openjdk@17/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### 2. Android Studioのインストール
1. [Android Studio](https://developer.android.com/studio)をダウンロード
2. インストール後、以下を設定：
   - Android SDK
   - Android SDK Platform
   - Android Virtual Device

### 3. 環境変数の設定
```bash
# ~/.zshrc または ~/.bash_profile に追加
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

### 4. Androidアプリの実行
```bash
# プロジェクトディレクトリに移動
cd mobile

# Metroサーバーを起動
npm start

# 新しいターミナルでAndroidアプリを実行
npm run android
```

## アプリの起動手順

### 1. Metroサーバーを起動
```bash
cd mobile
npm start
```

### 2. プラットフォームを選択して実行

**iOSの場合:**
```bash
npm run ios
```

**Androidの場合:**
```bash
npm run android
```

## アプリの使い方

### 基本操作

1. **地名検索**: 検索バーに「東京 渋谷」のように都道府県と市区町村を入力
2. **フィルター**: 「すべて」「神社」「寺院」から選択  
3. **表示切り替え**: 「📝 リスト」と「🗺️ 地図」を切り替え
4. **詳細表示**: カードまたはマーカーをタップして詳細情報を表示

### 機能詳細

- **🔍 検索機能**: 地名による神社・寺院の検索
- **⛩️ 種別フィルター**: 神社・寺院の絞り込み
- **📿 御朱印情報**: 御朱印の有無を視覚的に表示
- **📍 位置情報**: 現在地の表示（位置情報許可が必要）
- **🗺️ 地図表示**: 神社は赤、寺院は青緑のマーカー

## 開発時のホットリロード

アプリを実行中にコードを変更すると、自動的に更新されます（Fast Refresh機能）。

**手動リロード:**
- **Android**: <kbd>R</kbd>キーを2回押すか、<kbd>Ctrl</kbd> + <kbd>M</kbd>（Windows/Linux）または<kbd>Cmd ⌘</kbd> + <kbd>M</kbd>（macOS）でDev Menuから「Reload」を選択
- **iOS**: iOSシミュレーターで<kbd>R</kbd>キーを押す

## プロジェクト構成

```
mobile/
├── src/
│   ├── components/          # 再利用可能なコンポーネント
│   │   ├── SearchBar.tsx    # 検索バーコンポーネント
│   │   ├── MapView.tsx      # 地図表示コンポーネント
│   │   └── ShrineTempleCard.tsx # 神社・寺院カードコンポーネント
│   ├── screens/             # 画面コンポーネント
│   │   └── HomeScreen.tsx   # メイン画面
│   ├── services/            # API接続サービス
│   │   └── ApiService.ts    # バックエンドAPI接続
│   └── types/               # TypeScript型定義
│       └── index.ts         # 共通型定義
├── ios/                     # iOS固有の設定
├── android/                 # Android固有の設定
└── App.tsx                  # アプリのエントリーポイント
```

## トラブルシューティング

### よくある問題と解決方法

#### iOS関連

**問題:** `xcode-select: error: tool 'xcodebuild' requires Xcode`
```bash
# 解決方法: Xcode開発者ディレクトリを正しく設定
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
```

**問題:** `CocoaPods not installed`
```bash
# 解決方法: CocoaPodsをインストール
brew install cocoapods
# または
sudo gem install cocoapods
```

**問題:** `pod install`が失敗する
```bash
# 解決方法: CocoaPodsのキャッシュをクリア
cd ios
pod deintegrate
pod setup
pod install
```

#### Android関連

**問題:** `Java Runtime not found`
```bash
# 解決方法: JDKをインストール
brew install openjdk@17
```

**問題:** `adb: command not found`
```bash
# 解決方法: Android SDKのパスを設定
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

**問題:** `No emulators found`
```bash
# 解決方法: Android Studioでエミュレーターを作成
# 1. Android Studioを開く
# 2. AVD Manager → Create Virtual Device
# 3. エミュレーターを作成して起動
```

#### 共通の問題

**問題:** Metro server起動時のポートエラー
```bash
# 解決方法: ポート8081を解放
lsof -ti:8081 | xargs kill -9
npm start
```

**問題:** キャッシュの問題
```bash
# 解決方法: キャッシュをクリア
npm start --reset-cache
# または
npx react-native start --reset-cache
```

**問題:** ビルドエラー
```bash
# 解決方法: node_modulesを再インストール
rm -rf node_modules
npm install
```

### 開発環境の確認
問題を解決する前に、まず開発環境の状態を確認：
```bash
npx react-native doctor
```

### 詳細なトラブルシューティング
より詳しい情報は[React Native公式トラブルシューティング](https://reactnative.dev/docs/troubleshooting)ページを参照してください。

## 関連リンク

- [React Native公式ドキュメント](https://reactnative.dev/docs/getting-started)
- [React Native Maps](https://github.com/react-native-maps/react-native-maps)
- [バックエンドAPI情報](../README.md)