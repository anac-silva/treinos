import { BadRequestException, Controller, Get, Param, ParseUUIDPipe, Post, Query, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { PHOTO_MAX_BYTES } from './image-validation';
import { PhotosService } from './photos.service';

@Controller('clients/:clientId/photo')
export class PhotosController {
  constructor(private readonly service: PhotosService) {}
  @Get() principal(@Param('clientId', ParseUUIDPipe) clientId: string) { return this.service.principal(clientId); }
  @Get('content')
  async content(@Param('clientId', ParseUUIDPipe) clientId: string, @Query('key') key: string, @Res() response: Response) {
    if (!key) throw new BadRequestException('Informe a chave da foto.');
    const photo = await this.service.content(clientId, key);
    response.setHeader('Cache-Control', 'private, no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.type(photo.mimeType).send(photo.buffer);
  }
  @Post()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: PHOTO_MAX_BYTES, files: 1, fields: 0, parts: 1 } }))
  upload(@Param('clientId', ParseUUIDPipe) clientId: string, @UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Envie a foto no campo file.');
    return this.service.upload(clientId, file.buffer, file.mimetype);
  }
}
