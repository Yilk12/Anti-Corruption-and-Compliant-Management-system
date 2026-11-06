import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor(
    @Inject('CLOUDINARY') private readonly cloudinaryClient: typeof cloudinary,
  ) {}

  private extractErrorMessage(err: any): string {
    return (
      err?.message ||
      err?.error?.message ||
      err?.error?.error?.message ||
      err?.response?.data?.error?.message ||
      err?.response?.data?.message ||
      err?.toString?.() ||
      'Cloudinary upload failed'
    );
  }

  // -------------------- PDF Upload --------------------
  async uploadPdf(file: Express.Multer.File): Promise<string> {
    if (!file) throw new BadRequestException('No file uploaded');

    const isPdf =
      file.mimetype === 'application/pdf' ||
      file.originalname?.toLowerCase().endsWith('.pdf');
    const resourceType = isPdf ? 'raw' : 'auto';

    try {
      if (file.buffer && file.buffer.length) {
        const url = await new Promise<string>((resolve, reject) => {
          const upload = this.cloudinaryClient.uploader.upload_stream(
            {
              folder: 'pdf_uploads',
              resource_type: resourceType,
            },
            (err, result?: UploadApiResponse) => {
              if (err) return reject(err);
              if (!result?.secure_url)
                return reject(new Error('No URL returned from Cloudinary'));
              resolve(result.secure_url);
            },
          );
          upload.end(file.buffer);
        });
        return url;
      }

      if ((file as any).path) {
        const result: UploadApiResponse =
          await this.cloudinaryClient.uploader.upload((file as any).path, {
            folder: 'pdf_uploads',
            resource_type: resourceType,
          });
        return result.secure_url;
      }

      throw new Error('No file buffer or path available for upload');
    } catch (error: any) {
      console.error('[CloudinaryService] uploadPdf error:', error);
      const reason = this.extractErrorMessage(error);
      throw new BadRequestException(reason);
    }
  }

  // -------------------- Image Upload --------------------
  async uploadImage(file: Express.Multer.File): Promise<string> {
    if (!file) throw new BadRequestException('No file uploaded');

    // Validate image type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid image type. Only JPG, PNG, WEBP allowed.');
    }

    try {
      if (file.buffer && file.buffer.length) {
        const url = await new Promise<string>((resolve, reject) => {
          const upload = this.cloudinaryClient.uploader.upload_stream(
            {
              folder: 'image_uploads',
              resource_type: 'image',
            },
            (err, result?: UploadApiResponse) => {
              if (err) return reject(err);
              if (!result?.secure_url)
                return reject(new Error('No URL returned from Cloudinary'));
              resolve(result.secure_url);
            },
          );
          upload.end(file.buffer);
        });
        return url;
      }

      if ((file as any).path) {
        const result: UploadApiResponse =
          await this.cloudinaryClient.uploader.upload((file as any).path, {
            folder: 'image_uploads',
            resource_type: 'image',
          });
        return result.secure_url;
      }

      throw new Error('No file buffer or path available for upload');
    } catch (error: any) {
      console.error('[CloudinaryService] uploadImage error:', error);
      const reason = this.extractErrorMessage(error);
      throw new BadRequestException(reason);
    }
  }
}
