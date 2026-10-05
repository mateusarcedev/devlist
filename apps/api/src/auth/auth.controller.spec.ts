import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthenticatedUserGuard } from 'src/common/guards/authenticated-user.guard';

const mockAuthService = {
  upsertUser: jest.fn(),
  generateTokens: jest.fn(),
  refresh: jest.fn(),
  logout: jest.fn(),
  findUserById: jest.fn(),
};

const mockResponse = () => {
  const res: any = {};
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  res.redirect = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('AuthController', () => {
  let controller: AuthController;
  const originalNodeEnv = process.env.NODE_ENV;
  const originalCookieDomain = process.env.COOKIE_DOMAIN;
  const originalFrontendUrl = process.env.FRONTEND_URL;

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'development';
    delete process.env.COOKIE_DOMAIN;
    process.env.FRONTEND_URL = 'http://localhost:3000';

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    })
      .overrideGuard(AuthenticatedUserGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterAll(() => {
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;

    if (originalCookieDomain === undefined) delete process.env.COOKIE_DOMAIN;
    else process.env.COOKIE_DOMAIN = originalCookieDomain;

    if (originalFrontendUrl === undefined) delete process.env.FRONTEND_URL;
    else process.env.FRONTEND_URL = originalFrontendUrl;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('githubCallback', () => {
    it('should upsert user, set cookies, and redirect to FRONTEND_URL', async () => {
      const user = {
        githubId: 42,
        name: 'Alice',
        email: 'a@a.com',
        avatar: 'https://avatar',
      };
      const dbUser = { ...user, role: 'USER' };
      const tokens = {
        accessToken: 'access.token',
        refreshToken: 'raw-refresh-token',
      };

      mockAuthService.upsertUser.mockResolvedValue(dbUser);
      mockAuthService.generateTokens.mockResolvedValue(tokens);

      const req = { user } as any;
      const res = mockResponse();

      await controller.githubCallback(req, res);

      expect(mockAuthService.upsertUser).toHaveBeenCalledWith(user);
      expect(mockAuthService.generateTokens).toHaveBeenCalledWith(42, 'USER');
      expect(res.cookie).toHaveBeenCalledWith(
        'access_token',
        'access.token',
        expect.objectContaining({
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          path: '/',
        }),
      );
      expect(res.cookie).toHaveBeenCalledWith(
        'refresh_token',
        'raw-refresh-token',
        expect.objectContaining({
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          path: '/auth',
        }),
      );
      expect(res.redirect).toHaveBeenCalledWith('http://localhost:3000');
    });

    it('should share secure cookies with the frontend host in production', async () => {
      process.env.NODE_ENV = 'production';
      process.env.COOKIE_DOMAIN = 'example.com';
      process.env.FRONTEND_URL = 'https://app.example.com';

      const user = {
        githubId: 42,
        name: 'Alice',
        email: 'a@a.com',
        avatar: 'https://avatar',
      };
      const dbUser = { ...user, role: 'USER' };

      mockAuthService.upsertUser.mockResolvedValue(dbUser);
      mockAuthService.generateTokens.mockResolvedValue({
        accessToken: 'access.token',
        refreshToken: 'raw-refresh-token',
      });

      const res = mockResponse();
      await controller.githubCallback({ user } as any, res);

      expect(res.cookie).toHaveBeenCalledWith(
        'access_token',
        'access.token',
        expect.objectContaining({
          secure: true,
          sameSite: 'lax',
          domain: 'example.com',
          path: '/',
        }),
      );
      expect(res.cookie).toHaveBeenCalledWith(
        'refresh_token',
        'raw-refresh-token',
        expect.objectContaining({
          secure: true,
          sameSite: 'lax',
          path: '/auth',
        }),
      );
      const refreshCookieOptions = (res.cookie as jest.Mock).mock.calls.find(
        ([name]) => name === 'refresh_token',
      )?.[2];
      expect(refreshCookieOptions).not.toHaveProperty('domain');
      expect(res.redirect).toHaveBeenCalledWith('https://app.example.com');
    });
  });

  describe('refresh', () => {
    it('should set new cookies on successful refresh', async () => {
      const tokens = { accessToken: 'new.access', refreshToken: 'new.refresh' };
      mockAuthService.refresh.mockResolvedValue(tokens);

      const req = { cookies: { refresh_token: 'old-raw-token' } } as any;
      const res = mockResponse();

      await controller.refresh(req, res);

      expect(mockAuthService.refresh).toHaveBeenCalledWith('old-raw-token');
      expect(res.cookie).toHaveBeenCalledTimes(2);
      expect(res.json).toHaveBeenCalledWith({ ok: true });
    });

    it('should clear shared cookies after an invalid refresh in production', async () => {
      process.env.NODE_ENV = 'production';
      process.env.COOKIE_DOMAIN = 'example.com';
      mockAuthService.refresh.mockRejectedValue(new Error('expired'));

      const req = { cookies: { refresh_token: 'expired-token' } } as any;
      const res = mockResponse();

      await controller.refresh(req, res);

      expect(res.clearCookie).toHaveBeenCalledWith(
        'access_token',
        expect.objectContaining({
          domain: 'example.com',
          secure: true,
          sameSite: 'lax',
          path: '/',
        }),
      );
      expect(res.clearCookie).toHaveBeenCalledWith(
        'refresh_token',
        expect.objectContaining({
          secure: true,
          sameSite: 'lax',
          path: '/auth',
        }),
      );
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return 401 when refresh_token cookie is missing', async () => {
      const req = { cookies: {} } as any;
      const res = mockResponse();

      await controller.refresh(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(mockAuthService.refresh).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should revoke the refresh token and clear matching cookie scopes', async () => {
      process.env.NODE_ENV = 'production';
      process.env.COOKIE_DOMAIN = 'example.com';
      mockAuthService.logout.mockResolvedValue(undefined);

      const req = { cookies: { refresh_token: 'raw-token' } } as any;
      const res = mockResponse();

      await controller.logout(req, res);

      expect(mockAuthService.logout).toHaveBeenCalledWith('raw-token');
      expect(res.clearCookie).toHaveBeenCalledWith(
        'access_token',
        expect.objectContaining({
          domain: 'example.com',
          path: '/',
        }),
      );
      expect(res.clearCookie).toHaveBeenCalledWith(
        'refresh_token',
        expect.objectContaining({
          path: '/auth',
        }),
      );
      expect(res.json).toHaveBeenCalledWith({ ok: true });
    });
  });

  describe('me', () => {
    it('should return the current user from request', async () => {
      const dbUser = {
        githubId: 42,
        name: 'Alice',
        avatar: 'https://avatar',
        role: 'USER',
      };
      mockAuthService.findUserById.mockResolvedValue(dbUser);

      const req = { user: { id: 42 } } as any;
      const result = await controller.me(req);

      expect(mockAuthService.findUserById).toHaveBeenCalledWith(42);
      expect(result).toEqual(dbUser);
    });
  });
});
