import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuperAdminController } from './superadmin.controller';
import { SuperAdminService } from './superadmin.service';
import { BackupService } from './backup.service';
import { User } from '../users/entities/user.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, AuditLog]), AuditModule],
  controllers: [SuperAdminController],
  providers: [SuperAdminService, BackupService],
  exports: [SuperAdminService, BackupService],
})
export class SuperAdminModule {}