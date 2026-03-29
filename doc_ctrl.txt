import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { Doctor } from './entities/doctor.entity';
@Controller('doctors')

export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Post()
  create(@Body() createDoctorDto: Partial<Doctor>): Promise<Doctor> {
    return this.doctorsService.create(createDoctorDto);
  }

  @Get()
  findAll(@Query('specialty') specialty?: string): Promise<Doctor[]> {
    if (specialty) {
      return this.doctorsService.findBySpecialty(specialty);
    }
    return this.doctorsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Doctor> {
    return this.doctorsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDoctorDto: Partial<Doctor>,
  ): Promise<Doctor> {
    return this.doctorsService.update(id, updateDoctorDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.doctorsService.remove(id);
  }
}
