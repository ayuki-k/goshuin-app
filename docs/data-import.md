# 寺院・神社データの流し込み方法

## 概要
このドキュメントでは、CSVファイルから寺院・神社データをDynamoDBに流し込む方法を説明します。

## 必要なファイル形式

### CSVファイルの構造
以下のカラムを持つCSVファイルを用意してください：

```csv
id,prefecture,city,name,type,hasGoshuin,goshuinType,address,lat,lng,hours_notes,specialPeriod,officialUrl,photoUrl,source,updatedAt
```

### カラムの説明
- `id`: 一意識別子（例：tokyo-meiji-jingu）
- `prefecture`: 都道府県名（英語または日本語）
- `city`: 市区町村名
- `name`: 神社・寺院名
- `type`: `shrine`（神社）または `temple`（寺院）
- `hasGoshuin`: 御朱印の有無（`true` または `false`）
- `goshuinType`: 御朱印の種類（例：standard, limited）
- `address`: 住所
- `lat`: 緯度（decimal形式）
- `lng`: 経度（decimal形式）
- `hours_notes`: 参拝時間（例：6:00-18:00）
- `specialPeriod`: 特記事項
- `officialUrl`: 公式サイトURL
- `photoUrl`: 御朱印画像URL
- `source`: データソース（例：seed）
- `updatedAt`: 更新日（YYYY-MM-DD形式）

### サンプルデータ
```csv
id,prefecture,city,name,type,hasGoshuin,goshuinType,address,lat,lng,hours_notes,specialPeriod,officialUrl,photoUrl,source,updatedAt
tokyo-meiji-jingu,Tokyo,Shibuya,Meiji Jingu,shrine,true,standard,東京都渋谷区代々木神園町1-1,35.6762,139.6993,6:00-18:00,,https://www.meijijingu.or.jp/,,seed,2025-08-12
kanagawa-tsurugaoka-hachimangu,Kanagawa,Kamakura,Tsurugaoka Hachimangu,shrine,true,standard,神奈川県鎌倉市雪ノ下2-1-31,35.3258,139.5551,6:00-20:30,,https://www.hachimangu.or.jp/,,seed,2025-08-12
```

## 流し込み手順

### 1. 前提条件
- Docker Composeが起動していること
- LocalStackが動作していること
- DynamoDBテーブルが作成されていること

```bash
# LocalStackとテーブルの初期化
docker compose up -d
./scripts/init_localstack.sh
```

### 2. CSVファイルの配置
CSVファイルを `data/seed_kanto.csv` に配置します：

```bash
# CSVファイルをコピー
cp your_data.csv data/seed_kanto.csv
```

### 3. データの流し込み実行
以下のコマンドでデータを流し込みます：

```bash
LOCALSTACK_URL=http://localhost:4566 AWS_REGION=ap-northeast-1 \
python3 ./scripts/import_seed.py
```

### 4. 異なるCSVファイルを使用する場合
デフォルト以外のCSVファイルを使用する場合は、`SEED_CSV`環境変数を指定：

```bash
LOCALSTACK_URL=http://localhost:4566 AWS_REGION=ap-northeast-1 \
SEED_CSV=data/your_custom_data.csv \
python3 ./scripts/import_seed.py
```

## データの確認方法

### 1. DynamoDB GUI
ブラウザで http://localhost:8001 にアクセスしてデータを確認できます。

### 2. AWS CLI（LocalStack）
```bash
# テーブル内のアイテム数確認
aws dynamodb scan --table-name ShrineTemple \
    --endpoint-url http://localhost:4566 \
    --region ap-northeast-1 \
    --select COUNT

# 特定の都道府県でフィルタリング
aws dynamodb scan --table-name ShrineTemple \
    --endpoint-url http://localhost:4566 \
    --region ap-northeast-1 \
    --filter-expression "prefecture = :pref" \
    --expression-attribute-values '{":pref":{"S":"Tokyo"}}'
```

### 3. API経由での確認
```bash
# 全データ取得
curl "http://localhost:3001/shrines-temples"

# 都道府県で検索
curl "http://localhost:3001/shrines-temples?prefecture=Tokyo"

# 神社のみ検索
curl "http://localhost:3001/shrines-temples?type=shrine"
```

## トラブルシューティング

### よくある問題と解決方法

#### 1. LocalStackに接続できない
```bash
# LocalStackが起動しているか確認
docker ps | grep localstack

# ログを確認
docker compose logs localstack
```

#### 2. CSVファイルが見つからない
```bash
# ファイルの存在確認
ls -la data/seed_kanto.csv

# ファイルの内容確認
head -5 data/seed_kanto.csv
```

#### 3. 文字化けエラー
CSVファイルがUTF-8エンコーディングで保存されていることを確認してください。

#### 4. 座標データのエラー
緯度・経度が数値形式（decimal）であることを確認してください。空文字の場合は0が設定されます。

## 都道府県名の対応

アプリは日本語・英語両方の都道府県名に対応しています：

| 日本語 | 英語 |
|--------|------|
| 東京 / 東京都 | Tokyo |
| 神奈川 / 神奈川県 | Kanagawa |
| 大阪 / 大阪府 | Osaka |
| 京都 / 京都府 | Kyoto |

検索時は両方の形式で検索可能です。

## データ更新時の注意事項

1. **重複ID**: 同じIDのデータは上書きされます
2. **座標データ**: 緯度・経度は地図表示と距離計算に重要です
3. **御朱印情報**: `hasGoshuin`フィールドは検索フィルターに使用されます
4. **バックアップ**: 重要なデータは定期的にバックアップを取ってください

## 参考情報

- [LocalStack Documentation](https://docs.localstack.cloud/)
- [DynamoDB API Reference](https://docs.aws.amazon.com/dynamodb/)
- [CSV形式について](https://tools.ietf.org/html/rfc4180)