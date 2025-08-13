# Goshuin App – Docker Local Dev Template

ローカルで **LocalStack (S3/DynamoDB)** と **画像透かし用 Lambda コンテナ**を起動し、
Seed CSV を DynamoDB に流し込めるテンプレです。生成日: 2025-08-12

## 必要要件
- Docker Desktop または Colima
- AWS CLI v2（ローカル用。資格情報はダミーでOK）
- Python 3.11（seedスクリプト実行用 ※コンテナでも可）

## セットアップ
```bash
cp .env.example .env
docker compose up -d
./scripts/init_localstack.sh
```

### Seedデータ投入
`data/seed_kanto.csv` にCSVを置き、次を実行：
```bash
LOCALSTACK_URL=http://localhost:4566 AWS_REGION=ap-northeast-1 \
python3 ./scripts/import_seed.py
```
> 詳細な手順とCSVファイル形式については [データ流し込みガイド](./docs/data-import.md) を参照してください。

### 画像ワーカーをローカル実行（お試し）
`data/sample.jpg` を置いて以下を実行：
```bash
docker compose run --rm image-worker python3 handler.py local
# 生成物: S3(goshuin-public-share) に sample_shared.jpg ができます（LocalStack上）
```

### DynamoDBのGUI
http://localhost:8001 でテーブルを閲覧できます。

## 構成
- `localstack`：S3/DynamoDB（AppSyncはローカル未対応が多いため割愛）
- `image-worker`：Lambda互換のPythonコンテナ。ローカルはコマンド実行、クラウドはECRにpushしてLambdaへ。
- `scripts/init_localstack.sh`：S3バケット/テーブルの作成
- `scripts/import_seed.py`：Seed CSVをShrineTempleテーブルに投入

## 次の一手
- AppSync/GraphQL は **本番/プレビュー環境**で検証（ローカル再現は難易度高）
- 共有画像のキー命名・透かし文言を要件に合わせて変更
- ジオコーディング前処理（別バッチ/ECS）を追加
