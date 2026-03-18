import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { MedicalRecordsService } from './medical-records.service';
import { MedicalRecord } from './entities/medical-record.entity';

@Controller('medical-records')
export class MedicalRecordsController {
  constructor(private readonly medicalRecordsService: MedicalRecordsService) {}

  @Post()
  create(@Body() data: Partial<MedicalRecord>) {
    return this.medicalRecordsService.create(data);
  }

  @Get()
  findAll(@Query('patientId') patientId?: string, @Query('doctorId') doctorId?: string) {
    if (patientId) {
      return this.medicalRecordsService.findByPatient(patientId);
    }
    if (doctorId) {
      return this.medicalRecordsService.findByDoctor(doctorId);
    }
    return this.medicalRecordsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.medicalRecordsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: Partial<MedicalRecord>) {
    return this.medicalRecordsService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.medicalRecordsService.remove(id);
  }
}