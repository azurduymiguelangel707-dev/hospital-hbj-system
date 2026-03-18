import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import * as CryptoJS from 'crypto-js';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
  ) {}

  async logEvent(params: {
    eventType: 'ACCESS' | 'CREATE' | 'UPDATE' | 'DELETE';
    resourceType: string;
    resourceId: string;
    userId?: string;
    userRole?: string;
    userIp?: string;
    actionDetails?: any;
  }): Promise<AuditLog> {
    const lastBlock = await this.auditRepository.findOne({
      where: {},
      order: { blockIndex: 'DESC' },
    });

    const previousHash = lastBlock ? lastBlock.currentHash : '0';
    const timestamp = new Date().toISOString(); // Guardar como string ISO desde el inicio

    const blockData = {
      eventType: params.eventType,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      userId: params.userId || 'system',
      userRole: params.userRole,
      userIp: params.userIp,
      actionDetails: params.actionDetails,
      previousHash: previousHash,
      timestamp: timestamp,
    };

    const { hash, nonce } = this.mineBlock(blockData);

    const newBlock = this.auditRepository.create({
      eventType: params.eventType,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      userId: params.userId || 'system',
      userRole: params.userRole,
      userIp: params.userIp,
      actionDetails: params.actionDetails,
      previousHash: previousHash,
      currentHash: hash,
      nonce: nonce,
    });

    return await this.auditRepository.save(newBlock);
  }

  private mineBlock(block: any, difficulty: number = 2): { hash: string; nonce: number } {
    let nonce = 0;
    let hash = '';
    const target = '0'.repeat(difficulty);

    while (true) {
      hash = this.calculateHash({
        ...block,
        nonce,
      });

      if (hash.substring(0, difficulty) === target) {
        break;
      }
      nonce++;
    }

    return { hash, nonce };
  }

  private calculateHash(block: any): string {
    const data = JSON.stringify({
      eventType: block.eventType,
      resourceType: block.resourceType,
      resourceId: block.resourceId,
      userId: block.userId,
      timestamp: block.timestamp,
      previousHash: block.previousHash,
      nonce: block.nonce,
      actionDetails: block.actionDetails,
    });

    return CryptoJS.SHA256(data).toString();
  }

  async verifyChain(): Promise<{ isValid: boolean; invalidBlocks: number[] }> {
    const blocks = await this.auditRepository.find({
      order: { blockIndex: 'ASC' },
    });

    const invalidBlocks: number[] = [];

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      
      // Verificar que el hash empiece con "00" (POW)
      if (!block.currentHash.startsWith('00')) {
        invalidBlocks.push(block.blockIndex);
        continue;
      }

      // Verificar el enlace con el bloque anterior
      if (i > 0) {
        const previousBlock = blocks[i - 1];
        if (block.previousHash !== previousBlock.currentHash) {
          invalidBlocks.push(block.blockIndex);
        }
      } else {
        // El primer bloque debe tener previousHash = "0"
        if (block.previousHash !== '0') {
          invalidBlocks.push(block.blockIndex);
        }
      }
    }

    return {
      isValid: invalidBlocks.length === 0,
      invalidBlocks,
    };
  }

  async getAuditTrail(resourceType: string, resourceId: string): Promise<AuditLog[]> {
    return await this.auditRepository.find({
      where: { resourceType, resourceId },
      order: { timestamp: 'DESC' },
    });
  }

  async getUserActivity(userId: string): Promise<AuditLog[]> {
    return await this.auditRepository.find({
      where: { userId },
      order: { timestamp: 'DESC' },
      take: 100,
    });
  }

  async getStatistics(): Promise<any> {
    const total = await this.auditRepository.count();
    const byEventType = await this.auditRepository
      .createQueryBuilder('audit')
      .select('audit.event_type', 'eventType')
      .addSelect('COUNT(*)', 'count')
      .groupBy('audit.event_type')
      .getRawMany();

    const byResourceType = await this.auditRepository
      .createQueryBuilder('audit')
      .select('audit.resource_type', 'resourceType')
      .addSelect('COUNT(*)', 'count')
      .groupBy('audit.resource_type')
      .getRawMany();

    return {
      totalBlocks: total,
      byEventType,
      byResourceType,
    };
  }

  async findAll(page: number = 1, limit: number = 50): Promise<{ data: AuditLog[]; total: number }> {
    const [data, total] = await this.auditRepository.findAndCount({
      order: { timestamp: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total };
  }
}
