import sharp from 'sharp';
import { validateImage, PHOTO_MAX_BYTES } from './image-validation';

describe('validação real da foto', () => {
  it('decodifica imagem e rejeita tipo incorreto, conteúdo inválido e excesso de tamanho', async () => {
    const png = await sharp({ create: { width: 2, height: 2, channels: 3, background: '#ffffff' } }).png().toBuffer();
    expect((await validateImage(png, 'image/png')).mimeType).toBe('image/png');
    await expect(validateImage(png, 'image/jpeg')).rejects.toThrow();
    await expect(validateImage(Buffer.from('fake png'), 'image/png')).rejects.toThrow();
    await expect(validateImage(Buffer.alloc(PHOTO_MAX_BYTES + 1), 'image/png')).rejects.toThrow();
    await expect(validateImage(png, 'image/svg+xml')).rejects.toThrow();
  });
});
