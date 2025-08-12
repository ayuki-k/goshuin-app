import os, io, pathlib
from PIL import Image, ImageDraw
import boto3

REGION = os.environ.get("AWS_REGION", "ap-northeast-1")
S3_ORIGINAL = os.environ.get("S3_BUCKET_ORIGINAL", "goshuin-private-original")
S3_SHARED = os.environ.get("S3_BUCKET_SHARED", "goshuin-public-share")
ENDPOINT = os.environ.get("LOCALSTACK_URL")

s3 = boto3.client("s3", endpoint_url=ENDPOINT) if ENDPOINT else boto3.client("s3", region_name=REGION)

def add_watermark(img: Image.Image, text="Goshuin App"):
    draw = ImageDraw.Draw(img, "RGBA")
    w, h = img.size
    margin = int(min(w, h) * 0.02)
    box_w = int(w * 0.35)
    box_h = int(h * 0.08)
    x0, y0 = w - box_w - margin, h - box_h - margin
    draw.rectangle([(x0, y0), (x0+box_w, y0+box_h)], fill=(0,0,0,120))
    draw.text((x0+margin, y0+margin), text, fill=(255,255,255,255))
    return img

def handler(event, context=None):
    # event: { "bucket": "...", "key": "path/to/file.jpg" }
    bucket = event.get("bucket", S3_ORIGINAL)
    key = event.get("key")
    if not key:
        return {"ok": False, "error": "key missing"}

    obj = s3.get_object(Bucket=bucket, Key=key)
    img = Image.open(obj["Body"]).convert("RGBA")
    img = add_watermark(img, text="Goshuin • Sample")
    # Downscale for sharing
    max_side = 1600
    ratio = min(max_side / img.width, max_side / img.height, 1.0)
    img = img.resize((int(img.width*ratio), int(img.height*ratio)))

    buf = io.BytesIO()
    img.convert("RGB").save(buf, format="JPEG", quality=85)
    buf.seek(0)

    out_key = key.rsplit(".",1)[0] + "_shared.jpg"
    s3.put_object(Bucket=S3_SHARED, Key=out_key, Body=buf.getvalue(), ContentType="image/jpeg")
    return {"ok": True, "shared_key": out_key}

if __name__ == "__main__":
    # Local test: data/sample.jpg -> s3://goshuin-public-share/sample_shared.jpg
    if ENDPOINT:
        s3.create_bucket(Bucket=S3_ORIGINAL)
        s3.create_bucket(Bucket=S3_SHARED)
    sample = pathlib.Path("/workspace/data/sample.jpg")
    if sample.exists():
        with open(sample, "rb") as f:
            s3.put_object(Bucket=S3_ORIGINAL, Key="sample.jpg", Body=f.read())
        print(handler({"key":"sample.jpg"}))
    else:
        print("Place a sample.jpg in data/ to test locally.")
