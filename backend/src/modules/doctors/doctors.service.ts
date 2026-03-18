import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from './entities/doctor.entity';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(Doctor)
    private doctorsRepository: Repository<Doctor>,
  ) {}

  async create(createDoctorDto: Partial<Doctor>): Promise<Doctor> {
    const doctor = this.doctorsRepository.create(createDoctorDto);
    return await this.doctorsRepository.save(doctor);
  }

  async findAll(): Promise<Doctor[]> {
    return await this.doctorsRepository.find({
      relations: ['user'],
    });
  }

  async findBySpecialty(specialty: string): Promise<Doctor[]> {
    return await this.doctorsRepository.find({
      where: { specialty },
      relations: ['user'],
    });
  }

  async findOne(id: string): Promise<Doctor> {
    const doctor = await this.doctorsRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!doctor) {
      throw new NotFoundException(`Doctor con ID ${id} no encontrado`);
    }

    return doctor;
  }

  async update(id: string, updateDoctorDto: Partial<Doctor>): Promise<Doctor> {
    const doctor = await this.findOne(id);
    Object.assign(doctor, updateDoctorDto);
    return await this.doctorsRepository.save(doctor);
  }

  async remove(id: string): Promise<void> {
    const doctor = await this.findOne(id);
    await this.doctorsRepository.remove(doctor);
  }
}
