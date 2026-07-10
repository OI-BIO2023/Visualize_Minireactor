# Visualize Minireactor

Independent Vite + React + TypeScript dashboard for four mini compost reactors.

## Stack

- Frontend: Vite, React, TypeScript
- Charts: Chart.js
- Backend: Netlify Functions, AWS SDK v3
- ML: local Python baseline scripts in `ml/`

## Local workflow

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Netlify env vars

- `MY_AWS_REGION`
- `MY_AWS_ACCESS_KEY_ID`
- `MY_AWS_SECRET_ACCESS_KEY`
- `MY_DDB_TABLE`
- `MY_DDB_PK_NAME`
- `MY_DDB_SK_NAME`
- `MY_DDB_IDENT_PREFIX`
- `MY_DDB_TS_PREFIX`
- `MY_ALLOWED_IDENTS`
- `MY_MAX_QUERY_DAYS`
- `MY_CACHE_TTL_SECONDS`
- `MY_STALE_ALERT_ENABLED`
- `MY_STALE_ALERT_THRESHOLD_MINUTES`
- `MY_STALE_ALERT_RECIPIENT`
- `MY_SMTP_HOST`
- `MY_SMTP_PORT`
- `MY_SMTP_SECURE`
- `MY_SMTP_USER`
- `MY_SMTP_PASS`
- `MY_SMTP_FROM`
- `MY_ALERT_STATE_PK_PREFIX`
- `MY_ALERT_STATE_SK`

Legacy fallback names are still supported during rollout, but the `MY_...` variants are preferred.

Stale alerts are implemented as a scheduled Netlify Function, but they stay disabled until `MY_STALE_ALERT_ENABLED=true` is set.
