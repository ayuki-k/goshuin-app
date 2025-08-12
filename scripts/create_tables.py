#!/usr/bin/env python3
"""
Create DynamoDB tables for the goshuin app
"""
import os
import boto3

ENDPOINT = os.environ.get("LOCALSTACK_URL", "http://localhost:4566")
REGION = os.environ.get("AWS_REGION", "ap-northeast-1")

dynamodb = boto3.resource("dynamodb", endpoint_url=ENDPOINT, region_name=REGION,
                          aws_access_key_id="test", aws_secret_access_key="test")

# Create ShrineTemple table
try:
    table = dynamodb.create_table(
        TableName='ShrineTemple',
        KeySchema=[
            {
                'AttributeName': 'id',
                'KeyType': 'HASH'
            }
        ],
        AttributeDefinitions=[
            {
                'AttributeName': 'id',
                'AttributeType': 'S'
            }
        ],
        BillingMode='PAY_PER_REQUEST'
    )
    print("Created ShrineTemple table")
except Exception as e:
    print(f"ShrineTemple table already exists or error: {e}")

# Create VisitRecord table
try:
    table = dynamodb.create_table(
        TableName='VisitRecord',
        KeySchema=[
            {
                'AttributeName': 'id',
                'KeyType': 'HASH'
            }
        ],
        AttributeDefinitions=[
            {
                'AttributeName': 'id',
                'AttributeType': 'S'
            },
            {
                'AttributeName': 'userId',
                'AttributeType': 'S'
            }
        ],
        GlobalSecondaryIndexes=[
            {
                'IndexName': 'userId-index',
                'KeySchema': [
                    {
                        'AttributeName': 'userId',
                        'KeyType': 'HASH'
                    }
                ],
                'Projection': {
                    'ProjectionType': 'ALL'
                }
            }
        ],
        BillingMode='PAY_PER_REQUEST'
    )
    print("Created VisitRecord table")
except Exception as e:
    print(f"VisitRecord table already exists or error: {e}")

print("Table creation completed")