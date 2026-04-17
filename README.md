# MotionDeck

MotionDeck is a premium presentation studio for professionals and agencies.

It includes:
- email/password auth
- premium starter templates
- browser-based slide editor
- drag/resize/add/duplicate/undo/redo/autosave
- PPTX import
- PDF import
- speaker notes
- asset library
- branded share links with optional passcodes
- presenter mode
- HTML export
- MP4 export

## Local Setup

1. Copy `.env.example` to `.env`.
2. Set `DATABASE_URL` to a running PostgreSQL database.
3. Run:

```bash
npm install
npm run prisma:generate
npm run dev
```

Open `http://localhost:3000`.

## Environment

Required:
- `DATABASE_URL`
- `NEXT_PUBLIC_APP_URL`
- `SESSION_SECRET`

Storage:
- `STORAGE_DRIVER=local` for development
- `STORAGE_DRIVER=s3` for production cloud storage

When using S3-compatible storage, set:
- `S3_REGION`
- `S3_BUCKET`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `S3_ENDPOINT` if using non-AWS storage
- `S3_PUBLIC_BASE_URL` if assets are served behind a CDN/custom domain
- `S3_FORCE_PATH_STYLE` if required by your provider

## Production Notes

Recommended production stack:
- PostgreSQL: Neon, Supabase, RDS, Railway Postgres
- Object storage: S3, Cloudflare R2, Supabase Storage, MinIO
- App hosting: Docker on Railway, Render, Fly.io, ECS, or similar

This app now targets PostgreSQL instead of SQLite.

## Docker Deploy

Build and run:

```bash
docker build -t motiondeck .
docker run -p 3000:3000 --env-file .env motiondeck
```

The Docker image:
- installs dependencies
- installs Playwright Chromium for MP4 export
- builds Next.js in standalone mode

## Deployment Checklist

1. Provision PostgreSQL
2. Set all required environment variables
3. Choose `local` or `s3` storage driver
4. Run `npm run prisma:migrate` during deploy
5. Ensure Playwright Chromium is available in the runtime image

## Key Routes

- `/dashboard`
- `/editor/[presentationId]`
- `/present/[presentationId]`
- `/p/[token]`
- `/api/presentations/[presentationId]/export/html`
- `/api/presentations/[presentationId]/export/mp4`

## Handoff Notes

The codebase is ready for repo upload and deployment wiring.

Main production-facing improvements completed:
- deployment-oriented Docker setup
- PostgreSQL Prisma configuration
- cloud-storage abstraction with S3-compatible support
- cleanup of shared export rendering
