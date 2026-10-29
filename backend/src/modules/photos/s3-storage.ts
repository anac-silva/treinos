import { Injectable, OnModuleDestroy, ServiceUnavailableException } from '@nestjs/common';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ObjectStorage } from './object-storage';

@Injectable()
export class S3Storage implements ObjectStorage, OnModuleDestroy {
  private readonly client?: S3Client;
  private readonly bucket?: string;
  constructor() {
    const provider = process.env.PHOTO_STORAGE || 'disabled';
    if (!['disabled', 's3'].includes(provider)) throw new Error('PHOTO_STORAGE deve ser disabled ou s3.');
    if (provider === 's3') {
      const bucket = process.env.S3_BUCKET;
      const region = process.env.S3_REGION;
      if (!bucket || !region) throw new Error('Configure S3_BUCKET e S3_REGION.');
      const endpoint = process.env.S3_ENDPOINT || undefined;
      if (endpoint) {
        const url = new URL(endpoint);
        if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || (process.env.NODE_ENV === 'production' && url.protocol !== 'https:')) throw new Error('S3_ENDPOINT inválido; HTTPS obrigatório em produção.');
      }
      const pathStyle = process.env.S3_FORCE_PATH_STYLE || 'false';
      if (!['true', 'false'].includes(pathStyle)) throw new Error('S3_FORCE_PATH_STYLE deve ser true ou false.');
      this.bucket = bucket;
      // Credenciais pela cadeia padrão do SDK: ambiente ou role, nunca no código.
      this.client = new S3Client({ region, endpoint, forcePathStyle: pathStyle === 'true' });
    }
  }
  private configured() {
    if (!this.client || !this.bucket) throw new ServiceUnavailableException('Object storage de fotos não configurado.');
    return { client: this.client, bucket: this.bucket };
  }
  async put(key: string, body: Buffer, mimeType: string) {
    const { client, bucket } = this.configured();
    await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: mimeType, CacheControl: 'private, no-store' }));
  }
  async remove(key: string) {
    const { client, bucket } = this.configured();
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  }
  async read(key: string) {
    const { client, bucket } = this.configured();
    const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    if (!result.Body) throw new ServiceUnavailableException('A foto não está disponível no object storage.');
    return Buffer.from(await result.Body.transformToByteArray());
  }
  async readUrl(key: string) {
    const { client, bucket } = this.configured();
    return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key, ResponseCacheControl: 'private, no-store' }), { expiresIn: 300 });
  }
  onModuleDestroy() { this.client?.destroy(); }
}
