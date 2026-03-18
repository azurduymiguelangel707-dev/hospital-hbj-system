import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum UserRole {
  ADMIN = 'ADMIN',
  MEDICO = 'MEDICO',
  PACIENTE = 'PACIENTE',
  ENFERMERIA = 'ENFERMERIA',
  FARMACIA = 'FARMACIA',
  LABORATORIO = 'LABORATORIO',
  SUPERADMIN = 'SUPERADMIN',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Column({ nullable: true })
  keycloak_id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column({ name: 'password_hash', nullable: true })
  password_hash: string;

  @Column({
    type: 'enum',
    enum: UserRole,
  })
  role: UserRole;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}



