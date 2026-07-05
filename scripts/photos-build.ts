import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import "dotenv/config";

const ORIGINALS_DIR = path.resolve("photos/originals");
const GENERATED_DIR = path.resolve("photos/generated");
const PHOTOS_JSON = path.resolve("src/data/photos.json");
const PUBLIC_BASE_URL = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, "");

const DISPLAY_WIDTHS = [640, 1200, 1800, 2400];
const ULTRA_HD_WIDTHS = [3200, 4000];
const FORMATS = [
  { name: "avif", extension: "avif", options: { quality: 95, effort: 9 } },
  { name: "webp", extension: "webp", options: { quality: 98, effort: 6 } },
] as const;

interface Photo {
  id: string;
  title: string;
  description: string;
  alt?: string;
  source?: string;
  src?: string;
  aspectRatio?: number;
  variants?: Record<string, Record<string, string>>;
  ultraHdVariants?: Record<string, Record<string, string>>;
}

async function readPhotos(): Promise<Photo[]> {
  const raw = await readFile(PHOTOS_JSON, "utf-8");
  return JSON.parse(raw) as Photo[];
}

function variantUrl(fileName: string) {
  return PUBLIC_BASE_URL ? `${PUBLIC_BASE_URL}/${fileName}` : `/photos/generated/${fileName}`;
}

async function main() {
  await mkdir(GENERATED_DIR, { recursive: true });

  const photos = await readPhotos();
  let processed = 0;

  for (const photo of photos) {
    if (!photo.source) {
      console.log(`Saltada ${photo.id}: no tiene campo "source".`);
      continue;
    }

    const inputPath = path.join(ORIGINALS_DIR, photo.source);
    const id = photo.id;
    const metadata = await sharp(inputPath).metadata().catch(() => null);

    if (!metadata?.width || !metadata.height) {
      console.log(`Saltada ${photo.id}: no encuentro photos/originals/${photo.source}`);
      continue;
    }

    const displayWidths = DISPLAY_WIDTHS.filter((candidate) => candidate <= metadata.width!);
    const ultraHdWidths = ULTRA_HD_WIDTHS.filter((candidate) => candidate <= metadata.width!);
    const variants: Record<string, Record<string, string>> = {};
    const ultraHdVariants: Record<string, Record<string, string>> = {};

    async function generateVariants(widths: number[], target: Record<string, Record<string, string>>) {
      for (const width of widths) {
        for (const format of FORMATS) {
          const outputFile = `${id}-${width}.${format.extension}`;
          const outputPath = path.join(GENERATED_DIR, outputFile);

          let pipeline = sharp(inputPath).rotate().resize({ width, withoutEnlargement: true });

          if (format.name === "avif") {
            pipeline = pipeline.avif(format.options);
          } else {
            pipeline = pipeline.webp(format.options);
          }

          await pipeline.toFile(outputPath);

          target[format.name] ??= {};
          target[format.name][String(width)] = variantUrl(outputFile);

          console.log(`Generada ${outputFile}`);
        }
      }
    }

    await generateVariants(displayWidths, variants);
    await generateVariants(ultraHdWidths, ultraHdVariants);

    photo.aspectRatio = Number((metadata.width / metadata.height).toFixed(4));
    photo.variants = variants;
    if (ultraHdWidths.length) {
      photo.ultraHdVariants = ultraHdVariants;
    } else {
      delete photo.ultraHdVariants;
    }

    photo.src = variants.webp?.[String(displayWidths.at(-1))] || variants.avif?.[String(displayWidths.at(-1))] || photo.src;
    processed++;
  }

  await writeFile(PHOTOS_JSON, `${JSON.stringify(photos, null, 2)}\n`, "utf-8");
  console.log(`\nListo. Fotos procesadas: ${processed}. Metadata actualizada en src/data/photos.json`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
