import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthenticatedUserGuard } from './authenticated-user.guard';
import { sign } from 'jsonwebtoken';

const TEST_SECRET = 'test-secret';

function makeToken(payload: object) {
  return sign(payload, TEST_SECRET);
}

function makeContext(request: object): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('AuthenticatedUserGuard', () => {
  let guard: AuthenticatedUserGuard;

  beforeEach(() => {
    process.env.JWT_SECRET = TEST_SECRET;
    guard = new AuthenticatedUserGuard();
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
    delete process.env.NEXTAUTH_SECRET;
  });

  describe('Bearer header auth (legacy)', () => {
    it('should authenticate via Authorization: Bearer header with sub claim', () => {
      const token = makeToken({ sub: 42 });
      const req: any = { cookies: {}, headers: { authorization: `Bearer ${token}` } };
      const result = guard.canActivate(makeContext(req));
      expect(result).toBe(true);
      expect(req.user).toEqual({ id: 42 });
    });

    it('should authenticate via Authorization: Bearer header with githubId claim', () => {
      const token = makeToken({ githubId: 99 });
      const req: any = { cookies: {}, headers: { authorization: `Bearer ${token}` } };
      const result = guard.canActivate(makeContext(req));
      expect(result).toBe(true);
      expect(req.user).toEqual({ id: 99 });
    });

    it('should throw when Authorization header is missing and no cookie', () => {
      const req: any = { cookies: {}, headers: {} };
      expect(() => guard.canActivate(makeContext(req))).toThrow(UnauthorizedException);
    });

    it('should throw when token is invalid', () => {
      const req: any = { cookies: {}, headers: { authorization: 'Bearer invalid.token.here' } };
      expect(() => guard.canActivate(makeContext(req))).toThrow(UnauthorizedException);
    });
  });

  describe('cookie-based auth', () => {
    it('should authenticate via access_token cookie', () => {
      const token = makeToken({ sub: 42 });
      const req: any = { cookies: { access_token: token }, headers: {} };
      const result = guard.canActivate(makeContext(req));
      expect(result).toBe(true);
      expect(req.user).toEqual({ id: 42 });
    });

    it('should prefer cookie over Authorization header when both are present', () => {
      const cookieToken = makeToken({ sub: 10 });
      const headerToken = makeToken({ sub: 99 });
      const req: any = {
        cookies: { access_token: cookieToken },
        headers: { authorization: `Bearer ${headerToken}` },
      };
      const result = guard.canActivate(makeContext(req));
      expect(result).toBe(true);
      expect(req.user).toEqual({ id: 10 });
    });
  });

  describe('secret fallback', () => {
    it('should fall back to NEXTAUTH_SECRET when JWT_SECRET is not set', () => {
      delete process.env.JWT_SECRET;
      process.env.NEXTAUTH_SECRET = TEST_SECRET;
      const token = makeToken({ sub: 42 });
      const req: any = { cookies: {}, headers: { authorization: `Bearer ${token}` } };
      const result = guard.canActivate(makeContext(req));
      expect(result).toBe(true);
    });

    it('should throw when neither JWT_SECRET nor NEXTAUTH_SECRET is set', () => {
      delete process.env.JWT_SECRET;
      delete process.env.NEXTAUTH_SECRET;
      const req: any = { cookies: {}, headers: { authorization: 'Bearer anything' } };
      expect(() => guard.canActivate(makeContext(req))).toThrow(UnauthorizedException);
    });
  });
});
