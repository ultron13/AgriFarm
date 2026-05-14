import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

const BUCKET = process.env.R2_BUCKET_NAME ?? 'farmconnect-dev';
const PUBLIC_URL = process.env.R2_PUBLIC_URL ?? '';
const isMock = !process.env.R2_ACCOUNT_ID;

const s3 = isMock ? null : new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
  },
});

export function buildKey(prefix: string, ext = 'jpg'): string {
  return `${prefix}/${randomUUID()}.${ext}`;
}

export function publicUrl(key: string): string {
  return `${PUBLIC_URL}/${key}`;
}

export async function getUploadUrl(key: string, contentType: string): Promise<string> {
  if (isMock) return `http://localhost:3000/mock-r2/${key}`;
  const command = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType });
  return getSignedUrl(s3!, command, { expiresIn: 300 });
}

// Upload buffer directly (used by compliance doc route)
export async function uploadFile(key: string, buffer: Buffer, contentType: string): Promise<string> {
  if (isMock) return `mock://r2/${key}`;
  await s3!.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: buffer, ContentType: contentType }));
  return `${PUBLIC_URL}/${key}`;
}

export async function deleteFile(key: string): Promise<void> {
  if (isMock) return;
  await s3!.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}
