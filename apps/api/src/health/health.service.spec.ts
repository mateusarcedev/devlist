import { ServiceUnavailableException } from '@nestjs/common';
import { HealthService } from './health.service';

describe('HealthService', () => {
  it('reports liveness without touching the database', () => {
    const prisma = {
      $queryRaw: jest.fn(),
    } as any;
    const service = new HealthService(prisma);

    expect(service.live()).toEqual({
      status: 'ok',
      service: 'api',
      checks: {
        database: 'not-required',
      },
    });
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });

  it('reports readiness when the database answers', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    } as any;
    const service = new HealthService(prisma);

    await expect(service.ready()).resolves.toEqual({
      status: 'ok',
      service: 'api',
      checks: {
        database: 'up',
      },
    });
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it('returns service unavailable when the database is down', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockRejectedValue(new Error('database unavailable')),
    } as any;
    const service = new HealthService(prisma);

    await expect(service.ready()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
