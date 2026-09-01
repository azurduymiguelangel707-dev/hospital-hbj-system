import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Controller('seed')
export class SeedController {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  @Get()
  async seed() {
    const users = [
      { email: 'SUP-000001', first_name: 'Super', last_name: 'Admin', role: 'SUPERADMIN', password: 'SuperAdmin2024!' },
      { email: 'ADM-000001', first_name: 'Admin', last_name: 'Manana', role: 'ADMIN', password: 'Adm00001' },
      { email: 'ADM-TARDE-001', first_name: 'Admin', last_name: 'Tarde', role: 'ADMIN', password: 'hXGRpDfhn6' },
    ];
    const created = [];
    for (const u of users) {
      const exists = await this.userRepo.findOne({ where: { email: u.email } });
      if (!exists) {
        const hash = await bcrypt.hash(u.password, 10);
        const user = this.userRepo.create({ email: u.email, first_name: u.first_name, last_name: u.last_name, role: u.role as any, is_active: true, password_hash: hash });
        await this.userRepo.save(user);
        created.push(u.email);
      }
    }
    return { ok: true, created };
  }
}
