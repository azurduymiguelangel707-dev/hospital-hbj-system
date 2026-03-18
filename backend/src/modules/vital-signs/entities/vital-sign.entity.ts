import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Patient } from '../../patients/entities/patient.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';

@Entity('vital_signs')
export class VitalSign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'patient_id' })
  patientId: string;

  @Column({ name: 'appointment_id', nullable: true })
  appointmentId: string;

  @Column({ name: 'registered_by', nullable: true })
  registeredBy: string;

  @Column({ name: 'presion_arterial', nullable: true })
  presionArterial: string;

  @Column({ name: 'frecuencia_cardiaca', type: 'decimal', precision: 5, scale: 1, nullable: true })
  frecuenciaCardiaca: number;

  @Column({ name: 'frecuencia_respiratoria', type: 'decimal', precision: 5, scale: 1, nullable: true })
  frecuenciaRespiratoria: number;

  @Column({ name: 'temperatura', type: 'decimal', precision: 5, scale: 2, nullable: true })
  temperatura: number;

  @Column({ name: 'peso', type: 'decimal', precision: 6, scale: 2, nullable: true })
  peso: number;

  @Column({ name: 'saturacion_oxigeno', type: 'decimal', precision: 5, scale: 1, nullable: true })
  saturacionOxigeno: number;

  @Column({ type: 'text', nullable: true })
  notas: string;

  @CreateDateColumn({ name: 'registrado_en' })
  registradoEn: Date;

  @ManyToOne(() => Patient, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @ManyToOne(() => Appointment, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment;
}
