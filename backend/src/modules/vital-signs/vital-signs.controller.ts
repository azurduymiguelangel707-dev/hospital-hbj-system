import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { VitalSignsService } from './vital-signs.service';

@Controller('vital-signs')
export class VitalSignsController {
  constructor(private readonly svc: VitalSignsService) {}

  @Post()
  create(@Body() body: any) {
    return this.svc.create({
      patientId: body.patientId,
      appointmentId: body.appointmentId,
      registeredBy: body.registeredBy,
      presionArterial: body.presionArterial,
      frecuenciaCardiaca: body.frecuenciaCardiaca ? Number(body.frecuenciaCardiaca) : null,
      frecuenciaRespiratoria: body.frecuenciaRespiratoria ? Number(body.frecuenciaRespiratoria) : null,
      temperatura: body.temperatura ? Number(body.temperatura) : null,
      peso: body.peso ? Number(body.peso) : null,
      saturacionOxigeno: body.saturacionOxigeno ? Number(body.saturacionOxigeno) : null,
      notas: body.notas,
    });
  }

  @Get()
  findByPatient(@Query('patientId') patientId: string) {
    return this.svc.findByPatient(patientId);
  }

  @Get('latest')
  findLatest(@Query('patientId') patientId: string) {
    return this.svc.findLatestByPatient(patientId);
  }

  @Get('appointment/:appointmentId')
  findByAppointment(@Param('appointmentId') appointmentId: string) {
    return this.svc.findByAppointment(appointmentId);
  }
}
