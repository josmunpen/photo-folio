# Photo Folio

A simple photography portfolio built with Astro, Cloudflare Pages, and Cloudflare R2.

## Basic commands

```bash
npm run dev      # run the website locally
npm run build    # check that the website builds correctly
```

## How to add photos

The idea is to keep the original files out of the final repository, but while working locally you can place them here :

```text
photos/originals/
```

This folder is ignored by git.

Then add an entry to:

```text
src/data/photos.json
```

Example:

```json
{
  "id": "my-photo-01",
  "title": "My photo",
  "description": "Short description.",
  "alt": "Descriptive alternative text",
  "source": "my-photo-01.jpg"
}
```

The `source` field must match the file name inside `photos/originals/`.

## Generate web versions

```bash
npm run photos:build
```

This uses Sharp and generates files in:

```text
photos/generated/
```

Current formats:

- AVIF quality 95
- WebP quality 98

Current sizes:

- 640px
- 1200px
- 1800px
- 2400px
- 3200px
- 4000px

It also automatically updates `src/data/photos.json` with `aspectRatio`, `src`, and `variants`.

## Upload images to Cloudflare R2

Copy `.env.example` to `.env` and fill in:

```env
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_PUBLIC_BASE_URL=
```

Then run:

```bash
npm run photos:upload
```

Or run the full image workflow:

```bash
npm run photos:sync
```

## Deploy to Cloudflare Pages

Build command:

```bash
npm run build
```

Output directory:

```text
dist
```
