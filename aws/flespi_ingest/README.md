# Flespi ingest Lambda

This is the source deployed as the AWS Lambda function `flespi_ingest`.

The Flespi channel uses the ident template `__route__%ident%`. The prefix lets
Flespi accept messages whose source `ident` is empty. The Lambda removes the
prefix and routes an empty result to `MI`; explicit identifiers such as `LH`
remain separate.

Run the routing test with:

```powershell
python -m unittest aws/flespi_ingest/test_lambda_function.py
```
