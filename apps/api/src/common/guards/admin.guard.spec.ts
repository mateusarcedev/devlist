import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AdminGuard } from './admin.guard';

function makeContext(user?: { id: number; role?: 'USER' | 'ADMIN' }): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('AdminGuard', () => {
  const guard = new AdminGuard();

  it('allows an authenticated ADMIN', () => {
    expect(guard.canActivate(makeContext({ id: 1, role: 'ADMIN' }))).toBe(true);
  });

  it('rejects an authenticated USER', () => {
    expect(() => guard.canActivate(makeContext({ id: 1, role: 'USER' }))).toThrow(
      ForbiddenException,
    );
  });

  it('rejects a legacy authenticated user without a role claim', () => {
    expect(() => guard.canActivate(makeContext({ id: 1 }))).toThrow(
      ForbiddenException,
    );
  });
});
