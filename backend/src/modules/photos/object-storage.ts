export const OBJECT_STORAGE = Symbol('OBJECT_STORAGE');
export interface ObjectStorage {
  put(key: string, body: Buffer, mimeType: string): Promise<void>;
  remove(key: string): Promise<void>;
  readUrl(key: string): Promise<string>;
}
