import { Entity, Column, PrimaryGeneratedColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Appointment } from '../../appointments/entities/appointment.entity';

@Entity('patients')
export class Patient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'numero_historial', unique: true, nullable: true })
  numeroHistorial: string;

  @Column({ length: 200 })
  nombre: string;

  @Column({ length: 20, unique: true })
  ci: string;

  @Column({ type: 'int' })
  edad: number;

  @Column({ length: 20 })
  genero: string;

  @Column({ length: 10, nullable: true })
  tipoSangre: string;

  @Column({ length: 20, nullable: true })
  telefono: string;

  @Column({ length: 100, unique: true, nullable: true })
  email: string;

  @Column({ type: 'text', nullable: true })
  direccion: string;

  @Column({ name: 'especialidad_requerida', nullable: true })
  especialidadRequerida: string;

  @Column({ type: 'text', name: 'anamnesis', nullable: true })
  anamnesis: string;

  @Column({ type: 'text', name: 'diagnosticos_presuntivos', nullable: true })
  diagnosticosPresuntivos: string;

  @Column({ type: 'simple-array', nullable: true })
  alergias: string[];

  @Column({ type: 'simple-array', nullable: true })
  medicamentos: string[];

  @Column({ type: 'simple-array', nullable: true })
  condiciones: string[];

  @Column({ type: 'simple-array', nullable: true })
  cirugias: string[];

  @Column({ type: 'json', nullable: true })
  contactoEmergencia: {
    nombre: string;
    parentesco: string;
    telefono: string;
  };

  @Column({ name: 'push_token', nullable: true })
  pushToken: string;

  @OneToMany(() => Appointment, (appointment) => appointment.patient)
  appointments: Appointment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
