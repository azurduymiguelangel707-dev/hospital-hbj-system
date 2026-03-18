import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards, Res, StreamableFile } from '@nestjs/common';
import { SuperAdminService } from './superadmin.service';
import { BackupService } from './backup.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Response } from 'express';
import { createReadStream } from 'fs';
import { join } from 'path';

@Controller('superadmin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPERADMIN')
export class SuperAdminController {
  constructor(
    private readonly svc: SuperAdminService,
    private readonly backupSvc: BackupService,
  ) {}

  // â”€â”€â”€ SISTEMA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  @Get('db-stats')
  getDbStats() { return this.svc.getDbStats(); }

  @Get('system-info')
  getSystemInfo() { return this.svc.getSystemInfo(); }

  // â”€â”€â”€ USUARIOS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  @Get('users')
  getAllUsers() { return this.svc.getAllUsers(); }

  @Get('users/inactive')
  getInactiveUsers() { return this.svc.getInactiveUsers(); }

  @Patch('users/:id/role')
  changeRole(@Param('id') id: string, @Body() body: { role: string }) {
    return this.svc.changeUserRole(id, body.role);
  }

  @Patch('users/:id/toggle-active')
  toggleActive(@Param('id') id: string) {
    return this.svc.toggleUserActive(id);
  }

  @Patch('users/:id/reset-password')
  resetPassword(@Param('id') id: string) {
    return this.svc.resetUserPassword(id);
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string) {
    return this.svc.deleteUser(id);
  }

  // â”€â”€â”€ SEGURIDAD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  @Get('security/login-activity')
  getLoginActivity() { return this.svc.getLoginActivity(); }

  // â”€â”€â”€ REPORTES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  @Get('reportes/diario')
  getReporteDiario(@Query('fecha') fecha: string) {
    const f = fecha ?? new Date().toISOString().split('T')[0];
    return this.svc.getReporteDiario(f);
  }

  @Get('reportes/medico')
  getReporteMedico(
    @Query('doctorId') doctorId: string,
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
  ) { return this.svc.getReporteMedico(doctorId, fechaInicio, fechaFin); }

  @Get('reportes/especialidad')
  getReporteEspecialidad(
    @Query('especialidad') especialidad: string,
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
  ) { return this.svc.getReporteEspecialidad(especialidad, fechaInicio, fechaFin); }

  @Get('reportes/pacientes')
  getReportePacientes(
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
  ) { return this.svc.getReportePacientes(fechaInicio, fechaFin); }

  // â”€â”€â”€ BACKUP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  @Post('backup/crear')
  crearBackup(@Body() body: { descripcion?: string; userId?: string }) {
    return this.backupSvc.crearBackup(body.descripcion, body.userId ?? 'SUPERADMIN');
  }

  @Get('backup/listar')
  listarBackups() {
    return this.backupSvc.listarBackups();
  }

  @Get('backup/descargar/:filename')
  async descargarBackup(
    @Param('filename') filename: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const filePath = join(process.cwd(), 'backups', filename);
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    return new StreamableFile(createReadStream(filePath));
  }

  @Delete('backup/:filename')
  eliminarBackup(@Param('filename') filename: string) {
    return this.backupSvc.eliminarBackup(filename);
  }

  @Post('backup/restaurar/:filename')
  restaurarBackup(@Param('filename') filename: string) {
    return this.backupSvc.restaurarBackup(filename);
  }
}

