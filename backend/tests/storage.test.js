import { jest } from '@jest/globals';
import { uploadImageService } from '../services/storage.service.js';
import { LocalStorageProvider } from '../services/storage/LocalStorageProvider.js';
import fs from 'fs';
import path from 'path';

describe('Storage Service', () => {
    
    // We only test the validation logic and the fallback LocalStorageProvider
    // to avoid needing real API keys during CI/CD.
    
    it('should throw if no file is provided', async () => {
        await expect(uploadImageService(null)).rejects.toThrow('No file provided for upload');
    });

    it('should throw if file is not an image', async () => {
        const fakeFile = {
            mimetype: 'application/pdf',
            originalname: 'document.pdf',
            buffer: Buffer.from('fake data')
        };
        await expect(uploadImageService(fakeFile)).rejects.toThrow('Only image files are allowed');
    });

    describe('LocalStorageProvider', () => {
        let provider;
        const uploadDir = path.join(process.cwd(), 'uploads');

        beforeAll(() => {
            provider = new LocalStorageProvider();
            // Ensure uploads directory exists
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
        });

        afterAll(() => {
            // Clean up any files created in the uploads dir during tests
            if (fs.existsSync(uploadDir)) {
                fs.readdirSync(uploadDir).forEach((file) => {
                    if (file.includes('.png')) {
                        fs.unlinkSync(path.join(uploadDir, file));
                    }
                });
            }
        });

        it('should upload a file and return a URL', async () => {
            const fakeImage = {
                mimetype: 'image/png',
                originalname: 'test.png',
                buffer: Buffer.from('fake image data')
            };

            const { url } = await provider.uploadFile(fakeImage);
            expect(url).toContain('/uploads/');
            expect(url).toContain('.png');

            // Verify the file was actually written to disk
            const fileName = url.split('/').pop();
            const filePath = path.join(uploadDir, fileName);
            expect(fs.existsSync(filePath)).toBe(true);
            
            const content = fs.readFileSync(filePath, 'utf8');
            expect(content).toBe('fake image data');
        });
    });
});
