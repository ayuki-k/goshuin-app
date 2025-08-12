#!/usr/bin/env bash
set -euo pipefail
ENDPOINT=${LOCALSTACK_URL:-http://localhost:4566}
REGION=${AWS_REGION:-ap-northeast-1}

echo "Creating S3 buckets..."
aws --endpoint-url $ENDPOINT s3 mb s3://goshuin-private-original || true
aws --endpoint-url $ENDPOINT s3 mb s3://goshuin-public-share || true

echo "Creating DynamoDB tables..."
aws --endpoint-url $ENDPOINT dynamodb create-table   --table-name ShrineTemple   --attribute-definitions AttributeName=id,AttributeType=S   --key-schema AttributeName=id,KeyType=HASH   --billing-mode PAY_PER_REQUEST || true

aws --endpoint-url $ENDPOINT dynamodb create-table   --table-name VisitRecord   --attribute-definitions AttributeName=id,AttributeType=S AttributeName=userId,AttributeType=S   --key-schema AttributeName=id,KeyType=HASH   --global-secondary-indexes 'IndexName=userId-index,KeySchema=[{AttributeName=userId,KeyType=HASH}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=1,WriteCapacityUnits=1}'   --billing-mode PAY_PER_REQUEST || true

echo "Done. Open DynamoDB Admin at http://localhost:8001"
