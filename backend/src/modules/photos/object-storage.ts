export const OBJECT_STORAGE = Symbol('OBJECT_STORAGE');
export interface ObjectStorage {
  put(key: string, body: Buffer, mimeType: string): Promise<void>;
  remove(key: string): Promise<void>;
  read(key: string): Promise<Buffer>;
  readUrl(key: string): Promise<string>;
}
