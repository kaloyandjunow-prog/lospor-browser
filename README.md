# LOSPOR Database

Standalone read-only research, quality-improvement, and benchmarking interface
for LOSPOR.

The application never connects directly to PostgreSQL. It uses the versioned
LOSPOR API for authentication, governed cohort queries, pseudonymous case
inspection, quality reports, saved cohorts, benchmarks, and exports.

Browser v0.2.0 is compatible with LOSPOR API and Core v7.2.0.

## Local development

1. Start PostgreSQL and `lospor-api` on port `3002`.
2. Apply API migrations with `npx prisma migrate deploy`.
3. Configure `.env.local` from `.env.example`.
4. Run `npm ci`.
5. Run `npm run dev` and open `http://localhost:3003`.

The first release reads normalized LOSPOR data. Its API contract identifies the
data source so a central OMOP provider can later serve the same interface.

## Verification

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

The application is licensed under AGPL-3.0-or-later.
