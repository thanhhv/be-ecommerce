export interface IStorageService {
  save(file: Express.Multer.File): Promise<string>; // returns public URL
  delete(url: string): Promise<void>;
}
