import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private dataSource: DataSource,
    private readonly auditService: AuditService,
  ) {}

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({ order: { created_at: 'DESC' } });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(userData);
    return this.usersRepository.save(user);
  }

  async createWithPassword(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: UserRole;
  }): Promise<{ user: User; codigoAcceso: string; passwordTemporal: string }> {
    const exists = await this.usersRepository.findOne({ where: { email: data.email } });
    if (exists) throw new BadRequestException('El codigo de acceso ya existe');
    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = this.usersRepository.create({
      email: data.email,
      first_name: data.firstName,
      last_name: data.lastName,
      role: data.role,
      password_hash: passwordHash,
      is_active: true,
    });
    const saved = await this.usersRepository.save(user);
    await this.auditService.logEvent({ eventType: 'CREATE', resourceType: 'USERS', resourceId: saved.id, userId: 'admin', actionDetails: { email: saved.email, role: saved.role } }).catch(() => {});
    return { user: saved, codigoAcceso: data.email, passwordTemporal: data.password };
  }

  async update(id: string, userData: Partial<User>): Promise<User> {
    await this.usersRepository.update(id, userData);
    await this.auditService.logEvent({ eventType: 'UPDATE', resourceType: 'USERS', resourceId: id, userId: 'admin', actionDetails: userData }).catch(() => {});
    return this.findOne(id);
  }

  async toggleActive(id: string): Promise<User> {
    const user = await this.findOne(id);
    await this.usersRepository.update(id, { is_active: !user.is_active });
    await this.auditService.logEvent({ eventType: 'UPDATE', resourceType: 'USERS', resourceId: id, userId: 'admin', actionDetails: { is_active: !user.is_active } }).catch(() => {});
    return this.findOne(id);
  }

  async resetPassword(id: string, newPassword: string): Promise<void> {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.usersRepository.update(id, { password_hash: passwordHash } as any);
    await this.auditService.logEvent({ eventType: 'UPDATE', resourceType: 'USERS', resourceId: id, userId: 'admin', actionDetails: { action: 'reset_password' } }).catch(() => {});
  }

  async remove(id: string): Promise<void> {
    await this.auditService.logEvent({ eventType: 'DELETE', resourceType: 'USERS', resourceId: id, userId: 'admin', actionDetails: {} }).catch(() => {});
    await this.usersRepository.delete(id);
  }

  async getDashboardStats(): Promise<any> {
    const [totalUsers, totalDoctors, totalPatients, activeUsers] = await Promise.all([
      this.usersRepository.count(),
      this.usersRepository.count({ where: { role: UserRole.MEDICO } }),
      this.usersRepository.count({ where: { role: UserRole.PACIENTE } }),
      this.usersRepository.count({ where: { is_active: true } }),
    ]);
    return { totalUsers, totalDoctors, totalPatients, activeUsers, medicos: totalDoctors };
  }
}