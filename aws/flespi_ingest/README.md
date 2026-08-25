# Flespi ingest Lambda

This is the source deployed as the AWS Lambda function `flespi_ingest`.

The Flespi channel uses the ident template `__route__%ident%`. The prefix lets
Flespi accept messages whose source `ident` is empty. The Lambda removes the
prefix and routes an empty result to `MI`; explicit identifiers such as `LH`
remain separate.

A `MI` value frame containing `K.T1` updates the dedicated DynamoDB heartbeat.
Other value groups and events do not update it, so they cannot hide a stopped
HMI measurement stream. The defaults can be changed with
`HMI_HEARTBEAT_IDENT`, `HMI_HEARTBEAT_FIELDS`, `HMI_HEARTBEAT_PK_PREFIX`, and
`HMI_HEARTBEAT_SK`. The Lambda role only needs the existing `dynamodb:PutItem`
permission for both measurement and heartbeat records.
The heartbeat uses Flespi's `server.timestamp` or `timestamp` receive time and
keeps the source `ts` separately, so HMI clock drift and historical replays do
not corrupt freshness monitoring.

Run the routing test with:

```powershell
python -m unittest aws/flespi_ingest/test_lambda_function.py
```
