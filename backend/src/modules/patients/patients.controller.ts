import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { Patient } from './entities/patient.entity';

@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  findAll(): Promise<Patient[]> {
    return this.patientsService.findAll();
  }

  @Get('buscar')
  async buscar(@Query('ci') ci?: string, @Query('historial') historial?: string) {
    if (ci) return this.patientsService.findByCI(ci);
    if (historial) return this.patientsService.findByHistorial(historial);
    return null;
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Patient> {
    return this.patientsService.findOne(id);
  }

  @Get(':id/vitals/latest')
  getLatestVitals(@Param('id') id: string) {
    return this.patientsService.getLatestVitals(id);
  }

  @Post()
  create(@Body() data: Partial<Patient>): Promise<Patient> {
    return this.patientsService.create(data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: Partial<Patient>): Promise<Patient> {
    return this.patientsService.update(id, data);
  }

  @Patch(':id/push-token')
  async savePushToken(
    @Param('id') id: string,
    @Body('pushToken') pushToken: string,
  ) {
    await this.patientsService.update(id, { pushToken } as any);
    return { success: true, message: 'Push token guardado' };
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.patientsService.remove(id);
  }
}