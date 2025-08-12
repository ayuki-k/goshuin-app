# iOS シミュレーターでのデバッグ手順

## 1. 事前準備
```bash
# バックエンドサービス起動
docker compose up -d

# APIサーバー動作確認
curl http://localhost:3001/health
curl http://localhost:3001/shrines-temples
```

## 2. React Nativeアプリ起動
```bash
cd mobile

# Metro bundler起動
npm start

# 別ターミナルでiOSアプリ起動
npm run ios
```

## 3. iOS シミュレーターでの動作確認

### API接続テスト
1. シミュレーターでSafariを開く
2. `http://localhost:3001/health` にアクセス
3. `{"status":"ok","service":"goshuin-api"}` が表示されればAPI接続成功

### アプリでの動作確認
1. アプリを起動
2. 検索バーに「東京」と入力
3. 「神社」フィルターを選択
4. 「検索」ボタンをタップ
5. 明治神宮が表示されれば成功

## 4. デバッグ方法

### ネットワークログ確認
```javascript
// ApiService.ts の makeRequest メソッドに追加
console.log('API Request:', `${API_BASE_URL}${endpoint}`);
console.log('Response status:', response.status);
```

### Metro bundlerのコンソール確認
- ターミナルのMetroログでエラーや警告をチェック

### Flipperでのネットワークデバッグ（オプション）
```bash
# Flipperをインストールしてネットワークリクエストを監視
brew install --cask flipper
```

## 5. 想定される問題と解決策

### 問題1: API接続エラー
```
Network request failed
```
**解決**: 
- `localhost` ではなく `127.0.0.1` を試す
- APIサーバーが起動していることを確認

### 問題2: JSONパースエラー
```
JSON Parse error: Unexpected token
```
**解決**:
- API レスポンスの Content-Type を確認
- APIサーバーのエラーログをチェック

### 問題3: 地図が表示されない
**解決**:
- React Native Maps の iOS設定を確認
- 位置情報許可の確認

## 6. 実際の検証結果

### 成功パターン:
- [ ] Safari で API アクセス成功
- [ ] アプリで検索機能動作
- [ ] リスト表示成功  
- [ ] 地図表示成功

### エラーパターン:
- [ ] ネットワークエラー
- [ ] パースエラー
- [ ] 地図エラー

## 7. 開発時のヒント

### ホットリロード確認
- コードを変更して自動的に更新されるか確認
- `⌘+R` で手動リロード

### デバッグメニューアクセス  
- `⌘+D` でDev Menuを開く
- Remote JS Debuggingを有効化