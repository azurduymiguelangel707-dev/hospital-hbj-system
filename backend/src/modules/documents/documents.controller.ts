import {
  Controller, Get, Post, Delete, Param, Query,
  UseInterceptors, UploadedFile, Body, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { DocumentsService } from './documents.service';
import { DocType } from './entities/document.entity';

const storage = diskStorage({
  destination: join(process.cwd(), 'uploads'),
  filename: (_req, file, cb) => {
    cb(null, `${uuidv4()}${extname(file.originalname)}`);
  },
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
  @UseInterceptors(FileInterceptor('file', { storage, limits: { fileSize: 20 * 1024 * 1024 } }))
  async upload(
    @UploadedFile() file: any,
    @Body('patientId') patientId: string,
    @Body('appointmentId') appointmentId: string,
    @Body('doctorId') doctorId: string,
    @Body('tipo') tipo: DocType,
    @Body('descripcion') descripcion: string,
  ) {
    if (!file) throw new BadRequestException('Archivo requerido');
    const fileUrl = `/uploads/${file.filename}`;
    return this.svc.create({
      patientId, appointmentId, doctorId,
      tipo: tipo ?? DocType.OTRO,
      descripcion,
      fileUrl,
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


