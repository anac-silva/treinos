import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { LocalStorage } from './local-storage';

describe('armazenamento local de fotos', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  let root: string;

  beforeEach(async () => {
    process.env.NODE_ENV = 'development';
    root = await mkdtemp(resolve(tmpdir(), 'treinos-photos-'));
  });

  afterEach(async () => {
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
    await rm(root, { recursive: true, force: true });
  });

  it('grava, recupera e remove fotos fora da pasta pública', async () => {
    const storage = new LocalStorage(root);
    const key = 'clients/8540c1f8-04e2-4c4b-8d1b-8a04e1aaf266/photos/91dd6789-dbec-4445-9a0d-cc6dca3b670e';
    const image = Buffer.from('imagem de teste');
    await storage.put(key, image, 'image/png');
    await expect(storage.read(key)).resolves.toEqual(image);
    await expect(storage.readUrl(key)).resolves.toBe(`/api/clients/8540c1f8-04e2-4c4b-8d1b-8a04e1aaf266/photo/content?key=${encodeURIComponent(key)}`);
    await storage.remove(key);
    await expect(storage.read(key)).rejects.toThrow();
  });

  it('rejeita chaves que não pertencem ao formato gerado pelo servidor', async () => {
    const storage = new LocalStorage(root);
    await expect(storage.put('../secret', Buffer.from('x'), 'image/png')).rejects.toThrow('Chave de foto inválida.');
    await expect(storage.put('clients/8540c1f8-04e2-4c4b-8d1b-8a04e1aaf266/photos/91dd6789-dbec-4445-9a0d-cc6dca3b670e', Buffer.from('x'), 'text/plain')).rejects.toThrow('Tipo de imagem inválido.');
  });

  it('não permite habilitar armazenamento local fora de desenvolvimento', () => {
    process.env.NODE_ENV = 'production';
    expect(() => new LocalStorage(root)).toThrow('só pode ser usado em desenvolvimento');
  });
});
