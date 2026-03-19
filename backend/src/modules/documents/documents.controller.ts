import {
  Controller, Get, Post, Delete, Param, Query,
  UseInterceptors, UploadedFile, Body, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { DocumentsService } from './documents.service';
import { DocType } from './entities/document.entity';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dxyivspi8',
  api_key: process.env.CLOUDINARY_API_KEY || '381572823248681',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'GqhCDf_NLEqsYqCwZG0Y0Rc34lM',
});

@Controller('documents')
export class DocumentsController {
  constructor(private readonly svc: DocumentsService) {}

  @Get()
  findByPatient(@Query('patientId') patientId: string) {
    if (!patientId) throw new BadRequestException('patientId requerido');
    return this.svc.findByPatient(patientId);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } }))
  async upload(
    @UploadedFile() file: any,
    @Body('patientId') patientId: string,
    @Body('appointmentId') appointmentId: string,
    @Body('doctorId') doctorId: string,
    @Body('tipo') tipo: DocType,
    @Body('descripcion') descripcion: string,
  ) {
    if (!file) throw new BadRequestException('Archivo requerido');

    const result = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'hbj-hospital', resource_type: 'auto' },
        (error, result) => { if (error) reject(error); else resolve(result); }
      );
      stream.end(file.buffer);
    });

    return this.svc.create({
      patientId, appointmentId, doctorId,
      tipo: tipo ?? DocType.OTRO,
      descripcion,
      fileUrl: result.secure_url,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
    });
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.svc.delete(id);
  }
}