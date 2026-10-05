import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

export interface HealthPayload {
  status: 'ok';
  service: 'api';
  checks: {
    database: 'up' | 'not-required';
  };
}

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  live(): HealthPayload {
    return {
      status: 'ok',
      service: 'api',
      checks: {
        database: 'not-required',
      },
    };
  }

  async ready(): Promise<HealthPayload> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        status: 'ok',
        service: 'api',
        checks: {
          database: 'up',
        },
      };
    } catch {
      throw new ServiceUnavailableException({
        status: 'error',
        service: 'api',
        checks: {
          database: 'down',
        },
      });
    }
  }
}
