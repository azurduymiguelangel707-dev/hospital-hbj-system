import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'block_index', generated: 'increment' })
  blockIndex: number;

  @CreateDateColumn({ name: 'timestamp' })
  timestamp: Date;

  @Column({ name: 'event_type', length: 50 })
  eventType: 'ACCESS' | 'CREATE' | 'UPDATE' | 'DELETE';

  @Column({ name: 'resource_type', length: 50 })
  resourceType: string;

  @Column({ name: 'resource_id', length: 255 })
  resourceId: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column({ name: 'user_role', length: 50, nullable: true })
  userRole: string;

  @Column({ name: 'user_ip', length: 45, nullable: true })
  userIp: string;

  @Column({ name: 'action_details', type: 'jsonb', nullable: true })
  actionDetails: any;

  @Column({ name: 'previous_hash', length: 64, nullable: true })
  previousHash: string;

  @Column({ name: 'current_hash', length: 64 })
  currentHash: string;

  @Column({ name: 'nonce', default: 0 })
  nonce: number;

  @Column({ name: 'is_valid', default: true })
  isValid: boolean;
}