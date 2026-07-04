# Photo Folio

Portfolio de fotografía sencillo con Astro, Cloudflare Pages y Cloudflare R2.

## Comandos básicos

```bash
npm run dev      # ver la web en local
npm run build    # comprobar que la web compila
```

## Cómo añadir fotos

La idea es mantener los originales fuera del repo final, pero durante el trabajo local puedes ponerlos aquí:

```text
photos/originals/
```

Esta carpeta está ignorada por git.

Luego añade una entrada en:

```text
src/data/photos.json
```

Ejemplo:

```json
{
  "id": "mi-foto-01",
  "title": "Mi foto",
  "description": "Descripción corta.",
  "alt": "Texto alternativo descriptivo",
  "source": "mi-foto-01.jpg"
}
```

El campo `source` debe coincidir con el nombre del archivo en `photos/originals/`.

## Generar versiones web

```bash
npm run photos:build
```

Esto usa Sharp y genera:

```text
photos/generated/
```

Formatos actuales:

- AVIF calidad 95
- WebP calidad 98

Tamaños actuales:

- 640px
- 1200px
- 1800px
- 2400px
- 3200px
- 4000px

También actualiza automáticamente `src/data/photos.json` con `aspectRatio`, `src` y `variants`.

## Subir imágenes a Cloudflare R2

Copia `.env.example` a `.env` y rellena:

```env
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_PUBLIC_BASE_URL=
```

Después:

```bash
npm run photos:upload
```

O todo junto:

```bash
npm run photos:sync
```

## Despliegue en Cloudflare Pages

Build command:

```bash
npm run build
```

Output directory:

```text
dist
```
