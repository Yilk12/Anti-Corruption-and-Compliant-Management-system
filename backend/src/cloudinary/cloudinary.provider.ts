import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

export const CloudinaryProvider = {
  provide: 'CLOUDINARY',
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    const cloudName = config.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = config.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = config.get<string>('CLOUDINARY_API_SECRET');

    // Allow placeholder values for development
    if (!cloudName || !apiKey || !apiSecret) {
      const missing = [
        !cloudName ? 'CLOUDINARY_CLOUD_NAME' : null,
        !apiKey ? 'CLOUDINARY_API_KEY' : null,
        !apiSecret ? 'CLOUDINARY_API_SECRET' : null,
      ].filter(Boolean);
      throw new Error(
        `Cloudinary credentials missing: ${missing.join(', ')}. ` +
        `Ensure they are set in backend/.env and restart the server.`,
      );
    }

    // Skip configuration if using placeholder values
    if (cloudName === 'placeholder' || apiKey === 'placeholder' || apiSecret === 'placeholder') {
      console.warn('Cloudinary is using placeholder credentials - file upload features will be disabled');
      return null;
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
    return cloudinary;
  },
};
