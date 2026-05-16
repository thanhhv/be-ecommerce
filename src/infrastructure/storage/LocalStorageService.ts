import path from 'path';
import fs from 'fs/promises';
import { IStorageService } from './IStorageService';

export class LocalStorageService implements IStorageService {
  private readonly uploadDir: string;
  private readonly baseUrl: string;

  constructor() {
    this.uploadDir = path.resolve(process.env.UPLOAD_DIR || 'uploads');
    this.baseUrl = process.env.BASE_URL || 'http://localhost:3001';
  }

  async save(file: Express.Multer.File): Promise<string> {
    await fs.mkdir(this.uploadDir, { recursive: true });
    return `${this.baseUrl}/uploads/${file.filename}`;
  }

  async delete(url: string): Promise<void> {
    const filename = url.split('/uploads/').pop();
    if (!filename) return;
    const filePath = path.join(this.uploadDir, filename);
    await fs.unlink(filePath).catch(() => {});
  }
}
