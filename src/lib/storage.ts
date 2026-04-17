import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

type StoredObject = {
  key: string;
  url: string;
};

function getStorageDriver() {
  return process.env.STORAGE_DRIVER === "s3" ? "s3" : "local";
}

function publicBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

async function storeLocally(key: string, buffer: Buffer): Promise<StoredObject> {
  const storageRoot = path.join(process.cwd(), "storage");
  const absolutePath = path.join(storageRoot, key.replace(/^\/+/, ""));
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, buffer);

  return {
    key,
    url: `${publicBaseUrl()}/api/storage/${key.split(path.sep).join("/")}`,
  };
}

async function storeInS3(key: string, buffer: Buffer, contentType: string): Promise<StoredObject> {
  const region = process.env.S3_REGION;
  const bucket = process.env.S3_BUCKET;
  const endpoint = process.env.S3_ENDPOINT;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

  if (!region || !bucket || !accessKeyId || !secretAccessKey) {
    throw new Error("Missing S3 configuration.");
  }

  const client = new S3Client({
    region,
    endpoint,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );

  const customBaseUrl = process.env.S3_PUBLIC_BASE_URL?.replace(/\/$/, "");
  const url = customBaseUrl
    ? `${customBaseUrl}/${key}`
    : endpoint
      ? `${endpoint.replace(/\/$/, "")}/${bucket}/${key}`
      : `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

  return { key, url };
}

export async function storeObject(params: {
  key: string;
  buffer: Buffer;
  contentType: string;
}): Promise<StoredObject> {
  if (getStorageDriver() === "s3") {
    return storeInS3(params.key, params.buffer, params.contentType);
  }

  return storeLocally(params.key, params.buffer);
}
