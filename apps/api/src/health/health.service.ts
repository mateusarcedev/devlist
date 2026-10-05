import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

export interface LivenessPayload {
  status: 'ok';
  service: 'api';
  checks: {
    database: 'not-required';
  };
}

export interface ReadinessPayload {
  status: 'ok' | 'error';
  service: 'api';
  checks: {
    database: 'up' | 'down';
  };
}

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  live(): LivenessPayload {
    return {
      status: 'ok',
      service: 'api',
      checks: {
        database: 'not-required',
      },
    };
  }

  async ready(): Promise<ReadinessPayload> {
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
      return {
        status: 'error',
        service: 'api',
        checks: {
          database: 'down',
        },
      };
    }
  }
}
