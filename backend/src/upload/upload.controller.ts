import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { ApiConsumes, ApiOperation, ApiTags, ApiBody } from '@nestjs/swagger';
import multer from 'multer';

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  // -------------------- PDF Upload --------------------
  @Post('pdf')
  @ApiOperation({ summary: 'Upload a PDF file to Cloudinary' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'PDF file to upload',
        },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
      limits: { fileSize: 20 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const isPdf =
          file.mimetype === 'application/pdf' ||
          (file.originalname && file.originalname.toLowerCase().endsWith('.pdf'));
        if (!isPdf) return cb(new Error('Only PDF files are allowed'), false);
        cb(null, true);
      },
    }),
  )
  async uploadPdf(@UploadedFile() file: Express.Multer.File) {
    const url = await this.cloudinaryService.uploadPdf(file);
    return { message: 'Uploaded successfully', url };
  }

  // -------------------- Image Upload --------------------
  @Post('image')
  @ApiOperation({ summary: 'Upload an image file to Cloudinary' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file to upload (JPG, PNG, WEBP)',
        },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
      fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        if (!allowedTypes.includes(file.mimetype)) {
          return cb(new Error('Only JPG, PNG, or WEBP images are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    const url = await this.cloudinaryService.uploadImage(file);
    return { message: 'Image uploaded successfully', url };
  }

  // -------------------- Word Document Upload --------------------
  @Post('document')
  @ApiOperation({ summary: 'Upload a Word document to Cloudinary' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Word document to upload (DOC, DOCX)',
        },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
      limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
      fileFilter: (req, file, cb) => {
        const allowedTypes = [
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        const isWord =
          allowedTypes.includes(file.mimetype) ||
          (file.originalname && 
            (file.originalname.toLowerCase().endsWith('.doc') || 
             file.originalname.toLowerCase().endsWith('.docx')));
        if (!isWord) return cb(new Error('Only Word documents (DOC, DOCX) are allowed'), false);
        cb(null, true);
      },
    }),
  )
  async uploadDocument(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    const url = await this.cloudinaryService.uploadPdf(file); // Use same upload method as PDF
    return { message: 'Document uploaded successfully', url };
  }
}
