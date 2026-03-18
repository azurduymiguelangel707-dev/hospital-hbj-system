import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { Document } from './entities/document.entity';
import { AuditModule } from '../audit/audit.module';
import { join } from 'path';

@Module({
  imports: [
    TypeOrmModule.forFeature([Document]),
    MulterModule.register({ dest: join(process.cwd(), 'uploads') }),
    AuditModule,
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}