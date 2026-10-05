import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import { PrismaService } from 'src/prisma/prisma.service';

function makeContext(user?: { id: number }): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

function makeGuard(role: 'USER' | 'ADMIN' | null): AdminGuard {
  const prisma = {
    user: {
      findUnique: async () => (role ? { role } : null),
    },
  } as unknown as PrismaService;

  return new AdminGuard(prisma);
}

describe('AdminGuard', () => {
  it('allows a user whose current database role is ADMIN', async () => {
    await expect(
      makeGuard('ADMIN').canActivate(makeContext({ id: 1 })),
    ).resolves.toBe(true);
  });

  it('rejects a user whose current database role is USER', async () => {
    await expect(
      makeGuard('USER').canActivate(makeContext({ id: 1 })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects an authenticated identity that no longer exists', async () => {
    await expect(
      makeGuard(null).canActivate(makeContext({ id: 1 })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects a request without an authenticated user context', async () => {
    await expect(
      makeGuard('ADMIN').canActivate(makeContext()),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
