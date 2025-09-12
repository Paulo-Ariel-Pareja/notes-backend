import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @ApiOperation({
    summary: 'Health check',
    description: 'Check the overall health status of the application',
  })
  @ApiResponse({
    status: 200,
    description: 'Health status',
    example: {
      status: 'ok',
      timestamp: '2025-09-12T21:30:17.844Z',
      uptime: 6.6603989,
    },
  })
  @Get()
  checkHealth() {
    return this.healthService.checkHealth();
  }

  @ApiOperation({
    summary: 'Database health check',
    description: 'Check the database connection status',
  })
  @ApiResponse({
    status: 200,
    description: 'Database health status',
    example: {
      status: 'ok',
      database: 'connected',
      timestamp: '2025-09-12T21:31:09.270Z',
    },
  })
  @Get('database')
  async checkDatabase() {
    return this.healthService.checkDatabase();
  }
}
