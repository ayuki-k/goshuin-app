"""
Import seed CSV into DynamoDB (LocalStack).
CSV columns expected:
id,prefecture,city,name,type,hasGoshuin,goshuinType,address,lat,lng,hours_notes,specialPeriod,officialUrl,photoUrl,source,updatedAt
"""
import os, csv, boto3, decimal

ENDPOINT = os.environ.get("LOCALSTACK_URL", "http://localhost:4566")
REGION = os.environ.get("AWS_REGION", "ap-northeast-1")

dynamodb = boto3.resource("dynamodb", endpoint_url=ENDPOINT, region_name=REGION,
                          aws_access_key_id="test", aws_secret_access_key="test")

table = dynamodb.Table("ShrineTemple")

def str2num(x):
  try:
    return decimal.Decimal(x)
  except Exception:
    return None

with open(os.environ.get("SEED_CSV", "data/seed_kanto.csv"), newline="", encoding="utf-8") as f:
  reader = csv.DictReader(f)
  for row in reader:
    item = {
      "id": row["id"],
      "name": row["name"],
      "prefecture": row["prefecture"],
      "city": row.get("city",""),
      "type": row.get("type",""),
      "hasGoshuin": row.get("hasGoshuin","true") in ["true","True","1"],
      "goshuinType": row.get("goshuinType","unknown"),
      "address": row.get("address",""),
      "lat": str2num(row.get("lat","")) or decimal.Decimal("0"),
      "lng": str2num(row.get("lng","")) or decimal.Decimal("0"),
      "hours_notes": row.get("hours_notes",""),
      "specialPeriod": row.get("specialPeriod",""),
      "officialUrl": row.get("officialUrl",""),
      "photoUrl": row.get("photoUrl",""),
      "source": row.get("source","seed"),
      "updatedAt": row.get("updatedAt","")
    }
    table.put_item(Item=item)
print("Seed import completed")
