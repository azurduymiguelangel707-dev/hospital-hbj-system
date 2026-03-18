import { Controller, Get, Query, Param } from '@nestjs/common';
import { AuditService } from './audit.service';

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  async getAllLogs(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    
    return await this.auditService.findAll(pageNum, limitNum);
  }

  @Get('verify')
  async verifyBlockchain() {
    const result = await this.auditService.verifyChain();
    return {
      message: result.isValid 
        ? 'Integridad de la cadena verificada correctamente' 
        : 'Integridad de la cadena comprometida',
      ...result,
    };
  }

  @Get('statistics')
  async getStatistics() {
    return await this.auditService.getStatistics();
  }

  @Get('trail/:resourceType/:resourceId')
  async getAuditTrail(
    @Param('resourceType') resourceType: string,
    @Param('resourceId') resourceId: string,
  ) {
    return await this.auditService.getAuditTrail(resourceType, resourceId);
  }

  @Get('user/:userId')
  async getUserActivity(@Param('userId') userId: string) {
    return await this.auditService.getUserActivity(userId);
  }
}
