
import { LocalStorageProvider } from './storage/LocalStorageProvider.js';
import { GithubStorageProvider } from './storage/GithubStorageProvider.js';

let storageProvider;

// Factory to initialize the correct storage provider
if (process.env.STORAGE_PROVIDER === 'github') {
    if (!process.env.GITHUB_TOKEN || !process.env.GITHUB_REPO) {
        console.warn("WARNING: GitHub credentials not fully provided, falling back to LocalStorageProvider");
        storageProvider = new LocalStorageProvider();
    } else {
        storageProvider = new GithubStorageProvider();
    }
} else {
    storageProvider = new LocalStorageProvider();
}

/**
 * Service to handle file uploads
 * @param {Object} file - file object from multer
 * @returns {Promise<{ url: string, fileId: any }>} object containing public URL and provider-specific ID
 */
export const uploadImageService = async (file) => {
    if (!file) {
        throw new Error('No file provided for upload');
    }
    
    // Ensure it's an image
    if (!file.mimetype.startsWith('image/')) {
        throw new Error('Only image files are allowed');
    }

    return storageProvider.uploadFile(file);
};

/**
 * Service to handle file deletions
 * @param {Object} fileId - provider-specific file ID
 * @returns {Promise<void>}
 */
export const deleteImageService = async (fileId) => {
    if (!fileId) return;
    return storageProvider.deleteFile(fileId);
};
