import { Inject, Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../shared/database/prisma.service';
import { ClientsService } from '../clients/clients.service';
import { OBJECT_STORAGE, ObjectStorage } from './object-storage';
import { validateImage } from './image-validation';

@Injectable()
export class PhotosService {
  private readonly logger = new Logger('Photos');
  constructor(private readonly database: PrismaService, private readonly clients: ClientsService,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage) {}
  async upload(clientId: string, buffer: Buffer, mime: string) {
    await this.clients.require(clientId);
    const validated = await validateImage(buffer, mime);
    const storageKey = `clients/${clientId}/photos/${randomUUID()}`;
    try { await this.storage.put(storageKey, validated.data, validated.mimeType); }
    catch { throw new ServiceUnavailableException('Não foi possível enviar a foto ao object storage.'); }
    try {
      const photo = await this.database.$transaction(async (tx) => {
        // Lock do cliente serializa uploads concorrentes para a foto principal.
        await tx.client.update({ where: { id: clientId }, data: { updatedAt: new Date() } });
        await tx.clientPhoto.updateMany({ where: { clientId, principal: true }, data: { principal: false } });
        return tx.clientPhoto.create({ data: { clientId, storageKey, mimeType: validated.mimeType, sizeBytes: validated.data.length } });
      });
      return { id: photo.id, clientId: photo.clientId, mimeType: photo.mimeType, sizeBytes: photo.sizeBytes, createdAt: photo.createdAt, updatedAt: photo.updatedAt };
    } catch (error) {
      try { await this.storage.remove(storageKey); }
      catch { this.logger.error(JSON.stringify({ event: 'photo.cleanup.failed' })); }
      throw error;
    }
  }
  async principal(clientId: string) {
    await this.clients.require(clientId);
    const photo = await this.database.clientPhoto.findFirst({ where: { clientId, principal: true } });
    if (!photo) throw new NotFoundException('Cliente sem foto principal.');
    let url: string;
    try { url = await this.storage.readUrl(photo.storageKey); }
    catch { throw new ServiceUnavailableException('Não foi possível obter a foto do object storage.'); }
    return { id: photo.id, clientId: photo.clientId, mimeType: photo.mimeType, createdAt: photo.createdAt, updatedAt: photo.updatedAt, url, expiresIn: 300 };
  }
}
