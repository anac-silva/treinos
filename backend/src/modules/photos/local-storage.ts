import { Injectable } from '@nestjs/common';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { ObjectStorage } from './object-storage';

@Injectable()
export class LocalStorage implements ObjectStorage {
  constructor(private readonly root = resolve(process.cwd(), '.local-photos')) {
    if (process.env.NODE_ENV !== 'development') {
      throw new Error('Armazenamento local de fotos só pode ser usado em desenvolvimento.');
    }
  }

  private filePath(key: string) {
    if (!/^clients\/[0-9a-f-]{36}\/photos\/[0-9a-f-]{36}$/.test(key)) {
      throw new Error('Chave de foto inválida.');
    }
    const file = resolve(this.root, ...key.split('/'));
    const pathFromRoot = relative(this.root, file);
    if (!pathFromRoot || pathFromRoot.startsWith(`..${sep}`) || pathFromRoot === '..' || isAbsolute(pathFromRoot)) {
      throw new Error('Caminho de foto inválido.');
    }
    return file;
  }

  async put(key: string, body: Buffer, _mimeType: string) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(_mimeType)) {
      throw new Error('Tipo de imagem inválido.');
    }
    const file = this.filePath(key);
    await mkdir(resolve(file, '..'), { recursive: true });
    await writeFile(file, body, { flag: 'wx' });
  }

  async remove(key: string) {
    await rm(this.filePath(key), { force: true });
  }

  read(key: string) {
    return readFile(this.filePath(key));
  }

  async readUrl(key: string) {
    this.filePath(key);
    const clientId = key.split('/')[1];
    return `/api/clients/${clientId}/photo/content?key=${encodeURIComponent(key)}`;
  }
}
