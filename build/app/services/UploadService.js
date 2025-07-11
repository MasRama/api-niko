"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class UploadService {
    static async save(uploadField, subDir) {
        if (!uploadField) {
            throw new Error('Upload field is empty');
        }
        const uploadsRoot = path_1.default.join(process.cwd(), 'public', 'uploads');
        const targetDir = path_1.default.join(uploadsRoot, subDir);
        await fs_1.default.promises.mkdir(targetDir, { recursive: true });
        const safeName = uploadField.filename?.replace(/[^a-zA-Z0-9._-]/g, '_') || 'file';
        const fileName = `${Date.now()}_${safeName}`;
        const destPath = path_1.default.join(targetDir, fileName);
        if (typeof uploadField.save === 'function') {
            await uploadField.save(destPath);
        }
        else if (uploadField.file) {
            await new Promise((resolve, reject) => {
                const writeStream = fs_1.default.createWriteStream(destPath);
                uploadField.file.pipe(writeStream);
                uploadField.file.on('end', () => resolve());
                uploadField.file.on('error', reject);
            });
        }
        else {
            throw new Error('Unsupported uploadField format');
        }
        return path_1.default.posix.join('uploads', subDir, fileName);
    }
}
exports.default = UploadService;
//# sourceMappingURL=UploadService.js.map