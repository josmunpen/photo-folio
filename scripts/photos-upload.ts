import { readdir, stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import "dotenv/config";

const GENERATED_DIR = path.resolve("photos/generated");

const requiredEnv = ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"] as const;

function getEnv(name: (typeof requiredEnv)[number]) {
  const value = process.env[name];
  if (!value) throw new Error(`Falta ${name} en .env`);
  return value;
}

function contentType(fileName: string) {
  if (fileName.endsWith(".avif")) return "image/avif";
  if (fileName.endsWith(".webp")) return "image/webp";
  if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) return "image/jpeg";
  if (fileName.endsWith(".png")) return "image/png";
  return "application/octet-stream";
}

async function main() {
  for (const name of requiredEnv) getEnv(name);

  const accountId = getEnv("R2_ACCOUNT_ID");
  const bucket = getEnv("R2_BUCKET");

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: getEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: getEnv("R2_SECRET_ACCESS_KEY"),
    },
  });

  let files: string[];
  try {
    files = await readdir(GENERATED_DIR);
  } catch {
    console.log("No existe photos/generated. Ejecuta primero: npm run photos:build");
    return;
  }

  const imageFiles = files.filter((file) => /\.(avif|webp|jpe?g|png)$/i.test(file));

  if (imageFiles.length === 0) {
    console.log("No hay imágenes generadas para subir.");
    return;
  }

  for (const file of imageFiles) {
    const filePath = path.join(GENERATED_DIR, file);
    const fileStat = await stat(filePath);

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: file,
        Body: createReadStream(filePath),
        ContentLength: fileStat.size,
        ContentType: contentType(file),
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );

    console.log(`Subida ${file}`);
  }

  console.log(`\nListo. Archivos subidos: ${imageFiles.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
