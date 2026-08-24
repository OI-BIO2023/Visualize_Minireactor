import json
import os
from datetime import datetime, timedelta, timezone
from decimal import Decimal

import boto3


dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["TABLE_NAME"])

INGEST_SECRET = os.environ.get("INGEST_SECRET", "")
VALUE_RETENTION_DAYS = int(os.environ.get("VALUE_RETENTION_DAYS", "90"))
EVENT_RETENTION_DAYS = int(os.environ.get("EVENT_RETENTION_DAYS", "180"))


def lambda_handler(event, context):
    try:
        headers = normalize_headers(event.get("headers", {}))
        provided_secret = headers.get("x-ingest-token", "")

        if INGEST_SECRET and provided_secret != INGEST_SECRET:
            return response(403, {"ok": False, "error": "forbidden"})

        raw_body = event.get("body", "")
        if event.get("isBase64Encoded"):
            import base64

            raw_body = base64.b64decode(raw_body).decode("utf-8")

        if not raw_body:
            return response(400, {"ok": False, "error": "empty body"})

        data = json.loads(raw_body, parse_float=Decimal, parse_int=Decimal)
        messages = extract_messages(data)
        written = 0
        errors = []

        for msg in messages:
            try:
                print("RAW_MESSAGE:", json.dumps(msg, default=decimal_serializer))
                item = build_item(msg)
                print("ITEM_TO_STORE:", json.dumps(item, default=decimal_serializer))
                table.put_item(Item=item)
                written += 1
            except Exception as exc:
                errors.append(str(exc))

        return response(
            200,
            {"ok": True, "written": written, "errors": errors[:10]},
        )
    except Exception as exc:
        return response(500, {"ok": False, "error": str(exc)})


def normalize_headers(headers):
    return {str(key).lower(): value for key, value in headers.items()}


def extract_messages(data):
    if isinstance(data, list):
        return data

    if isinstance(data, dict):
        if "messages" in data and isinstance(data["messages"], list):
            return data["messages"]
        if "message" in data and isinstance(data["message"], dict):
            return [data["message"]]
        return [data]

    raise ValueError("unsupported payload format")


def build_item(msg):
    if not isinstance(msg, dict):
        raise ValueError("message is not an object")

    ident = extract_ident(msg)
    if ident and ident.startswith("__route__"):
        ident = ident[len("__route__") :].strip()
    ident = ident or "MI"

    ts = normalize_ts(msg.get("ts"))
    msg_type = detect_type(msg)
    retention_days = (
        VALUE_RETENTION_DAYS if msg_type == "value" else EVENT_RETENTION_DAYS
    )
    expires_at = int(
        (datetime.now(timezone.utc) + timedelta(days=retention_days)).timestamp()
    )

    return {
        "pk": f"DEVICE#{ident}",
        "sk": f"TS#{ts}#{msg_type.upper()}",
        "ident": ident,
        "type": msg_type,
        "ts": ts,
        "payload": build_clean_payload(msg),
        "expiresAt": expires_at,
    }


def build_clean_payload(msg):
    excluded_keys = {
        "ident",
        "ts",
        "type",
        "channel.id",
        "protocol.id",
        "server.timestamp",
        "timestamp",
    }
    return {key: value for key, value in msg.items() if key not in excluded_keys}


def extract_ident(msg):
    ident = msg.get("ident")

    if isinstance(ident, str):
        return ident.strip()

    if isinstance(ident, list) and ident:
        first = ident[0]
        if isinstance(first, str):
            return first.strip()

    return None


def normalize_ts(ts_value):
    if isinstance(ts_value, str) and ts_value.strip():
        ts = ts_value.strip()
        if ts.endswith("Z"):
            return ts
        return ts + "Z"
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def detect_type(msg):
    if "type" in msg and msg["type"] in ("value", "event"):
        return msg["type"]

    if any(isinstance(value, bool) for value in msg.values()):
        return "event"
    return "value"


def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body, default=decimal_serializer),
    }


def decimal_serializer(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")
