import { BadRequestException, Controller, Get, Param, ParseUUIDPipe, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { PHOTO_MAX_BYTES } from './image-validation';
import { PhotosService } from './photos.service';

@Controller('clients/:clientId/photo')
export class PhotosController {
  constructor(private readonly service: PhotosService) {}
  @Get() principal(@Param('clientId', ParseUUIDPipe) clientId: string) { return this.service.principal(clientId); }
  @Post()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: PHOTO_MAX_BYTES, files: 1, fields: 0, parts: 1 } }))
  upload(@Param('clientId', ParseUUIDPipe) clientId: string, @UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Envie a foto no campo file.');
    return this.service.upload(clientId, file.buffer, file.mimetype);
  }
}
