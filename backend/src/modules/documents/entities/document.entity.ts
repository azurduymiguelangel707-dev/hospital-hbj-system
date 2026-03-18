import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Patient } from '../../patients/entities/patient.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';

export enum DocType {
  RADIOGRAFIA  = 'RADIOGRAFIA',
  ECOGRAFIA    = 'ECOGRAFIA',
  TOMOGRAFIA   = 'TOMOGRAFIA',
  RESONANCIA   = 'RESONANCIA',
  ECG          = 'ECG',
  LABORATORIO  = 'LABORATORIO',
  RECETA       = 'RECETA',
  ORDEN        = 'ORDEN',
  FOTO_CLINICA = 'FOTO_CLINICA',
  OTRO         = 'OTRO',
}

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'patient_id' })
  patientId: string;

  @Column({ name: 'appointment_id', nullable: true })
  appointmentId: string;

  @Column({ name: 'doctor_id', nullable: true })
  doctorId: string;

  @Column({ type: 'enum', enum: DocType, default: DocType.OTRO })
  tipo: DocType;

  @Column({ nullable: true })
  descripcion: string;

  @Column({ name: 'file_url', nullable: true })
  fileUrl: string;

  @Column({ name: 'file_name', nullable: true })
  fileName: string;

  @Column({ name: 'file_size', default: 0 })
  fileSize: number;

  @Column({ name: 'mime_type', nullable: true })
  mimeType: string;

  @CreateDateColumn({ name: 'creado_en' })
  creadoEn: Date;

  @ManyToOne(() => Patient, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @ManyToOne(() => Appointment, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment;
}

