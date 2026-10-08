import { BadRequestException, PayloadTooLargeException } from '@nestjs/common';
import sharp from 'sharp';

export const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
const formats: Record<string, string> = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

export async function validateImage(buffer: Buffer, declaredMime: string) {
  if (!buffer.length) throw new BadRequestException('Envie uma imagem não vazia.');
  if (buffer.length > PHOTO_MAX_BYTES) throw new PayloadTooLargeException('A foto deve ter até 5 MB.');
  if (!Object.values(formats).includes(declaredMime)) throw new BadRequestException('Use JPEG, PNG ou WebP.');
  try {
    const image = sharp(buffer, { limitInputPixels: 20_000_000, failOn: 'warning' });
    const metadata = await image.metadata();
    const mimeType = formats[metadata.format || ''];
    if (!mimeType || mimeType !== declaredMime || (metadata.pages || 1) !== 1) throw new BadRequestException('Tipo declarado não corresponde à imagem ou arquivo animado.');
    // Decodifica/reencoda completamente, remove metadados EXIF e conteúdo extra.
    const data = await image.rotate().toBuffer();
    if (data.length > PHOTO_MAX_BYTES) throw new PayloadTooLargeException('A foto processada excede 5 MB.');
    return { data, mimeType };
  } catch (error) {
    if (error instanceof BadRequestException || error instanceof PayloadTooLargeException) throw error;
    throw new BadRequestException('Imagem inválida, corrompida ou com dimensões excessivas.');
  }
}
