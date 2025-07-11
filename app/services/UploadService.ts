import fs from 'fs';
import path from 'path';

export default class UploadService {
  /**
   * Save uploaded file to local disk under public/uploads/<subDir>/
   * @param uploadField  object returned by HyperExpress request.multipart() representing the file
   * @param subDir       sub directory inside uploads (e.g. 'profiles', 'banners')
   * @returns relative path (uploads/<subDir>/<fileName>) to be stored in DB
   */
  static async save(uploadField: any, subDir: string): Promise<string> {
    if (!uploadField) {
      throw new Error('Upload field is empty');
    }

    const uploadsRoot = path.join(process.cwd(), 'public', 'uploads');
    const targetDir = path.join(uploadsRoot, subDir);
    await fs.promises.mkdir(targetDir, { recursive: true });

    const safeName = uploadField.filename?.replace(/[^a-zA-Z0-9._-]/g, '_') || 'file';
    const fileName = `${Date.now()}_${safeName}`;
    const destPath = path.join(targetDir, fileName);

    // HyperExpress file field has .save(dest) helper; fallback to stream if not present
    if (typeof uploadField.save === 'function') {
      await uploadField.save(destPath);
    } else if (uploadField.file) {
      await new Promise<void>((resolve, reject) => {
        const writeStream = fs.createWriteStream(destPath);
        uploadField.file.pipe(writeStream);
        uploadField.file.on('end', () => resolve());
        uploadField.file.on('error', reject);
      });
    } else {
      throw new Error('Unsupported uploadField format');
    }

    // Return path relative to server root for public access
    return path.posix.join('uploads', subDir, fileName);
  }
} 