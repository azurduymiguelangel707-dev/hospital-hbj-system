// backend/src/modules/appointments/appointments.controller.ts
import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { ResetService } from './reset.service';

@Controller('appointments')
export class AppointmentsController {
  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly resetService: ResetService,
  ) {}

  @Get()
  findAll(@Query('doctorId') doctorId?: string, @Query('fecha') fecha?: string) {
    return this.appointmentsService.findAll(doctorId, fecha);
  }

  @Get('stats')
  getStats() {
    return this.appointmentsService.getStats();
  }

  
  @Get('slots')
  async getSlots(
    @Query('fecha') fecha: string,
    @Query('especialidad') especialidad: string,
    @Query('turno') turno: string,
  ) {
    return this.appointmentsService.getAvailableSlots(fecha, especialidad, turno);
  }

  @Post('agendar')
  async agendar(@Body() body: {
    patientId: string;
    doctorId: string;
    fecha: string;
    especialidad: string;
    turno: string;
    reason?: string;
  }) {
    return this.appointmentsService.createWithFicha(body);
  }
@Get(':id')
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Post()
  create(@Body() data: any) {
    return this.appointmentsService.create(data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.appointmentsService.update(id, data);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.appointmentsService.updateStatus(id, status);
  }

  @Patch(':id/cancel')
  cancel(
    @Param('id') id: string,
    @Body('cancellationReason') cancellationReason: string,
    @Body('cancelledById') cancelledById?: string,
  ) {
    return this.appointmentsService.cancel(id, cancellationReason, cancelledById);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.appointmentsService.remove(id);
  }

  @Get('followup')
  getFollowUp(@Query('doctorId') doctorId: string) {
    return this.appointmentsService.getFollowUpPatients(doctorId);
  }

  @Get('weekly-report')
  getWeeklyReport(@Query('doctorId') doctorId: string, @Query('weekOffset') weekOffset: string) {
    return this.appointmentsService.getWeeklyReport(doctorId, parseInt(weekOffset ?? '0'));
  }

  @Post(':id/vitals')
  async registerVitals(@Param('id') id: string, @Body() body: any) {
    await this.appointmentsService.registerVitals(id, body);
    return { success: true };
  }

  @Post('reset/ejecutar')
  async ejecutarReset(@Body() body: { fecha?: string; motivo?: string; userId?: string }) {
    const fecha = body.fecha ?? new Date().toISOString().split('T')[0];
    return this.resetService.archivarCitas(fecha, body.motivo ?? 'manual', body.userId ?? 'ADMIN');
  }

  @Get('reset/historial')
  getHistorialResets() { return this.resetService.getHistorialResets(); }

  @Get('reset/stats')
  getStatsArchivo() { return this.resetService.getStatsArchivo(); }

  @Get('stats/dashboard')
  async getDashboardStats() {    return this.appointmentsService.getDashboardStats();
  }
}

