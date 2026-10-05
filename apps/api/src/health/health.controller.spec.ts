import { HttpStatus } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  it('returns liveness payload directly', () => {
    const healthService = {
      live: jest.fn().mockReturnValue({
        status: 'ok',
        service: 'api',
        checks: { database: 'not-required' },
      }),
    } as unknown as HealthService;

    const controller = new HealthController(healthService);

    expect(controller.live()).toEqual({
      status: 'ok',
      service: 'api',
      checks: { database: 'not-required' },
    });
  });

  it('keeps readiness HTTP 200 while database is up', async () => {
    const healthService = {
      ready: jest.fn().mockResolvedValue({
        status: 'ok',
        service: 'api',
        checks: { database: 'up' },
      }),
    } as unknown as HealthService;
    const response = {
      status: jest.fn(),
    } as any;

    const controller = new HealthController(healthService);
    const result = await controller.ready(response);

    expect(response.status).not.toHaveBeenCalled();
    expect(result.status).toBe('ok');
  });

  it('sets readiness HTTP 503 while database is down', async () => {
    const healthService = {
      ready: jest.fn().mockResolvedValue({
        status: 'error',
        service: 'api',
        checks: { database: 'down' },
      }),
    } as unknown as HealthService;
    const response = {
      status: jest.fn(),
    } as any;

    const controller = new HealthController(healthService);
    const result = await controller.ready(response);

    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.SERVICE_UNAVAILABLE,
    );
    expect(result).toEqual({
      status: 'error',
      service: 'api',
      checks: { database: 'down' },
    });
  });
});
