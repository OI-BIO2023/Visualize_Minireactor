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

- `AWS_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `DDB_TABLE`
- `DDB_PK_NAME`
- `DDB_SK_NAME`
- `DDB_IDENT_PREFIX`
- `DDB_TS_PREFIX`
- `ALLOWED_IDENTS`
- `MAX_QUERY_DAYS`
- `CACHE_TTL_SECONDS`
