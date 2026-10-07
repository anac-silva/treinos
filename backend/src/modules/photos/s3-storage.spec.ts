import { S3Storage } from './s3-storage';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

describe('adaptador S3', () => {
  const original = { ...process.env };
  afterEach(() => { process.env = { ...original }; jest.restoreAllMocks(); });
  it('não usa storage local ou público como fallback', async () => {
    process.env.PHOTO_STORAGE = 'disabled';
    const storage = new S3Storage();
    await expect(storage.put('key', Buffer.from('data'), 'image/png')).rejects.toThrow('não configurado');
  });
  it('usa bucket/chave controlados sem ACL pública', async () => {
    process.env.PHOTO_STORAGE = 's3';
    process.env.S3_BUCKET = 'private-test-bucket';
    process.env.S3_REGION = 'us-east-1';
    delete process.env.S3_ENDPOINT;
    const send = jest.spyOn(S3Client.prototype, 'send').mockImplementation(async () => ({}));
    const storage = new S3Storage();
    try {
      await storage.put('clients/id/photos/random', Buffer.from('data'), 'image/png');
      const command = send.mock.calls[0][0] as PutObjectCommand;
      expect(command.input).toMatchObject({ Bucket: 'private-test-bucket', Key: 'clients/id/photos/random', ContentType: 'image/png' });
      expect(command.input.ACL).toBeUndefined();
      await storage.remove('clients/id/photos/random');
      expect(send.mock.calls[1][0]).toBeInstanceOf(DeleteObjectCommand);
    } finally { storage.onModuleDestroy(); }
  });
});
