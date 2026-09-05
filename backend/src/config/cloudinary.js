import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

/**
 * Configure Cloudinary with environment variables
 */
const configureCloudinary = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
    return true;
  }
  return false;
};

// Initialize configuration
const isConfigured = configureCloudinary();

/**
 * Check if Cloudinary is configured with valid credentials
 */
export const isCloudinaryConfigured = () => {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

/**
 * Upload a media file to Cloudinary with local storage fallback
 * @param {Object} file - Express Multer file object
 * @param {string} folder - Cloudinary folder name (e.g. 'taskplanet/posts')
 * @param {Object} [req] - Express request object for generating local URLs
 * @returns {Promise<{ url: string, publicId: string, provider: 'cloudinary' | 'local' }>}
 */
export const uploadMedia = async (file, folder = 'taskplanet', req = null) => {
  if (!file) {
    throw new Error('No file provided for upload');
  }

  // Re-check configuration dynamically in case env was loaded late
  if (isCloudinaryConfigured()) {
    try {
      configureCloudinary();
      const result = await cloudinary.uploader.upload(file.path, {
        folder,
        resource_type: 'auto',
        transformation: [
          { quality: 'auto:good' },
          { fetch_format: 'auto' },
        ],
      });

      // Clean up temporary local file after successful Cloudinary upload
      await fs.promises.unlink(file.path).catch((err) => {
        console.warn('Could not remove temporary local file:', err.message);
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
        provider: 'cloudinary',
      };
    } catch (cloudErr) {
      console.warn('Cloudinary upload failed, falling back to local storage:', cloudErr.message);
      // Fall through to local fallback below
    }
  }

  // Local storage fallback (used during testing or when Cloudinary is not configured)
  const host = req ? req.get('host') : (process.env.HOST || 'localhost:5001');
  const protocol = req ? req.protocol : 'http';
  const localUrl = `${protocol}://${host}/uploads/${file.filename}`;

  return {
    url: localUrl,
    publicId: file.filename,
    provider: 'local',
  };
};

/**
 * Delete a media file from Cloudinary (optional cleanup)
 * @param {string} publicId - Cloudinary public ID
 */
export const deleteMedia = async (publicId) => {
  if (isCloudinaryConfigured() && publicId) {
    try {
      configureCloudinary();
      await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      console.warn('Cloudinary delete error:', err.message);
    }
  }
};

export default {
  uploadMedia,
  deleteMedia,
  isCloudinaryConfigured,
};
