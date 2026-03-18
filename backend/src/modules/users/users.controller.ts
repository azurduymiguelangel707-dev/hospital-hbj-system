import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { User, UserRole } from './entities/user.entity';

function generateCode(role: UserRole): string {
  const prefixes: Record<string, string> = {
    MEDICO: 'MED', ENFERMERIA: 'ENF', ADMIN: 'ADM',
    PACIENTE: 'PAC', SUPERADMIN: 'SUP', FARMACIA: 'FAR', LABORATORIO: 'LAB',
  };
  const prefix = prefixes[role] ?? 'USR';
  const num = Math.floor(100000 + Math.random() * 900000).toString();
  return `${prefix}-${num}`;
}

function generatePassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get('stats')
  getStats() {
    return this.usersService.getDashboardStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<User> {
    return this.usersService.findOne(id);
  }

  @Post()
  create(@Body() userData: Partial<User>): Promise<User> {
    return this.usersService.create(userData);
  }

  // Endpoint principal para crear usuario desde el admin
  @Post('create-full')
  async createFull(@Body() body: {
    firstName: string;
    lastName: string;
    role: UserRole;
    email?: string;
    password?: string;
    especialidad?: string;
    licenseNumber?: string;
  }) {
    const codigoAcceso = body.email ?? generateCode(body.role);
    const password = body.password ?? generatePassword();
    const result = await this.usersService.createWithPassword({
      firstName: body.firstName,
      lastName: body.lastName,
      email: codigoAcceso,
      password,
      role: body.role,
    });
    return { ...result, passwordTemporal: password, codigoAcceso };
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() userData: Partial<User>): Promise<User> {
    return this.usersService.update(id, userData);
  }

  @Patch(':id/toggle-active')
  toggleActive(@Param('id') id: string): Promise<User> {
    return this.usersService.toggleActive(id);
  }

  @Patch(':id/reset-password')
  async resetPassword(@Param('id') id: string, @Body() body: { newPassword?: string }) {
    const newPassword = body.newPassword ?? generatePassword();
    await this.usersService.resetPassword(id, newPassword);
    return { success: true, newPassword };
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.usersService.remove(id);
  }
}
