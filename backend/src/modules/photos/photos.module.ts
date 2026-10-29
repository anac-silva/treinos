import { Module } from '@nestjs/common';
import { ClientsModule } from '../clients/clients.module';
import { OBJECT_STORAGE } from './object-storage';
import { PhotosController } from './photos.controller';
import { PhotosService } from './photos.service';
import { LocalStorage } from './local-storage';
import { S3Storage } from './s3-storage';
@Module({
  imports: [ClientsModule],
  controllers: [PhotosController],
  providers: [
    PhotosService,
    {
      provide: OBJECT_STORAGE,
      useFactory: () => process.env.PHOTO_STORAGE === 'local' ? new LocalStorage() : new S3Storage(),
    },
  ],
})
export class PhotosModule {}
