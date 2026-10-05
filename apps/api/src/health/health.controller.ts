import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { HealthService } from './health.service';

@Controller('health')
@ApiTags('Health')
@SkipThrottle()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe' })
  live() {
    return this.healthService.live();
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe with database check' })
  async ready(@Res({ passthrough: true }) res: Response) {
    const payload = await this.healthService.ready();

    if (payload.status === 'error') {
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
    }

    return payload;
  }
}
