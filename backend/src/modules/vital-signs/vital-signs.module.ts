import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VitalSignsController } from './vital-signs.controller';
import { VitalSignsService } from './vital-signs.service';
import { VitalSign } from './entities/vital-sign.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([VitalSign]), AuditModule],
  controllers: [VitalSignsController],
  providers: [VitalSignsService],
  exports: [VitalSignsService],
})
export class VitalSignsModule {}