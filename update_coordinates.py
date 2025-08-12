#!/usr/bin/env python3
"""
Update ShrineTemple data with coordinates directly to LocalStack DynamoDB
"""
import boto3
import decimal

# LocalStack configuration
ENDPOINT = "http://localhost:4566"
REGION = "ap-northeast-1"

dynamodb = boto3.resource("dynamodb", 
                         endpoint_url=ENDPOINT, 
                         region_name=REGION,
                         aws_access_key_id="test", 
                         aws_secret_access_key="test")

table = dynamodb.Table("ShrineTemple")

# Updated data with coordinates and details
shrines_data = [
    {
        "id": "tokyo-meiji-jingu",
        "name": "Meiji Jingu",
        "prefecture": "Tokyo",
        "city": "Shibuya", 
        "type": "shrine",
        "hasGoshuin": True,
        "goshuinType": "standard",
        "address": "東京都渋谷区代々木神園町1-1",
        "lat": decimal.Decimal("35.6762"),
        "lng": decimal.Decimal("139.6993"),
        "hours_notes": "6:00-18:00",
        "specialPeriod": "",
        "officialUrl": "https://www.meijijingu.or.jp/",
        "photoUrl": "",
        "source": "seed",
        "updatedAt": "2025-08-12"
    },
    {
        "id": "tokyo-senso-ji",
        "name": "Senso-ji",
        "prefecture": "Tokyo",
        "city": "Taito",
        "type": "temple",
        "hasGoshuin": True,
        "goshuinType": "standard",
        "address": "東京都台東区浅草2-3-1",
        "lat": decimal.Decimal("35.7148"),
        "lng": decimal.Decimal("139.7967"),
        "hours_notes": "6:00-17:00",
        "specialPeriod": "",
        "officialUrl": "https://www.senso-ji.jp/",
        "photoUrl": "",
        "source": "seed",
        "updatedAt": "2025-08-12"
    },
    {
        "id": "kanagawa-tsurugaoka-hachimangu",
        "name": "Tsurugaoka Hachimangu",
        "prefecture": "Kanagawa",
        "city": "Kamakura",
        "type": "shrine",
        "hasGoshuin": True,
        "goshuinType": "standard", 
        "address": "神奈川県鎌倉市雪ノ下2-1-31",
        "lat": decimal.Decimal("35.3258"),
        "lng": decimal.Decimal("139.5551"),
        "hours_notes": "6:00-20:30",
        "specialPeriod": "",
        "officialUrl": "https://www.hachimangu.or.jp/",
        "photoUrl": "",
        "source": "seed",
        "updatedAt": "2025-08-12"
    },
    {
        "id": "chiba-naritasan-shinshoji",
        "name": "Naritasan Shinshoji", 
        "prefecture": "Chiba",
        "city": "Narita",
        "type": "temple",
        "hasGoshuin": True,
        "goshuinType": "standard",
        "address": "千葉県成田市成田1",
        "lat": decimal.Decimal("35.7854"),
        "lng": decimal.Decimal("140.3128"),
        "hours_notes": "8:00-16:00",
        "specialPeriod": "",
        "officialUrl": "https://www.naritasan.or.jp/",
        "photoUrl": "",
        "source": "seed",
        "updatedAt": "2025-08-12"
    },
    {
        "id": "saitama-hikawa-jinja",
        "name": "Musashi Ichinomiya Hikawa Jinja",
        "prefecture": "Saitama", 
        "city": "Saitama",
        "type": "shrine",
        "hasGoshuin": True,
        "goshuinType": "standard",
        "address": "埼玉県さいたま市大宮区高鼻町1-407",
        "lat": decimal.Decimal("35.9064"),
        "lng": decimal.Decimal("139.6272"),
        "hours_notes": "6:00-17:00",
        "specialPeriod": "",
        "officialUrl": "http://musashiichinomiya-hikawa.or.jp/",
        "photoUrl": "",
        "source": "seed",
        "updatedAt": "2025-08-12"
    }
]

print("Updating ShrineTemple data with coordinates...")

for item in shrines_data:
    table.put_item(Item=item)
    print(f"✅ Updated: {item['name']} ({item['lat']}, {item['lng']})")

print("\n🎉 All data updated successfully!")
print("📍 Coordinates added for map display")