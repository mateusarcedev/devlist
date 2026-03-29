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

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    })
      .overrideGuard(AuthenticatedUserGuard)
      .useValue({ canActivate: () => true })
      .compile();
    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('githubCallback', () => {
    it('should upsert user, set cookies, and redirect to FRONTEND_URL', async () => {
      const user = { githubId: 42, name: 'Alice', email: 'a@a.com', avatar: 'https://avatar' };
      const dbUser = { ...user, role: 'USER' };
      const tokens = { accessToken: 'access.token', refreshToken: 'raw-refresh-token' };

      mockAuthService.upsertUser.mockResolvedValue(dbUser);
      mockAuthService.generateTokens.mockResolvedValue(tokens);

      const req = { user } as any;
      const res = mockResponse();
      process.env.FRONTEND_URL = 'http://localhost:3000';

      await controller.githubCallback(req, res);

      expect(mockAuthService.upsertUser).toHaveBeenCalledWith(user);
      expect(mockAuthService.generateTokens).toHaveBeenCalledWith(42, 'USER');
      expect(res.cookie).toHaveBeenCalledWith('access_token', 'access.token', expect.objectContaining({ httpOnly: true }));
      expect(res.cookie).toHaveBeenCalledWith('refresh_token', 'raw-refresh-token', expect.objectContaining({ httpOnly: true }));
      expect(res.redirect).toHaveBeenCalledWith('http://localhost:3000');
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

    it('should return 401 when refresh_token cookie is missing', async () => {
      const req = { cookies: {} } as any;
      const res = mockResponse();

      await controller.refresh(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(mockAuthService.refresh).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should clear cookies and call authService.logout', async () => {
      mockAuthService.logout.mockResolvedValue(undefined);

      const req = { cookies: { refresh_token: 'raw-token' } } as any;
      const res = mockResponse();

      await controller.logout(req, res);

      expect(mockAuthService.logout).toHaveBeenCalledWith('raw-token');
      expect(res.clearCookie).toHaveBeenCalledWith('access_token', expect.any(Object));
      expect(res.clearCookie).toHaveBeenCalledWith('refresh_token', expect.any(Object));
      expect(res.json).toHaveBeenCalledWith({ ok: true });
    });
  });

  describe('me', () => {
    it('should return the current user from request', async () => {
      const dbUser = { githubId: 42, name: 'Alice', avatar: 'https://avatar', role: 'USER' };
      mockAuthService.findUserById.mockResolvedValue(dbUser);

      const req = { user: { id: 42 } } as any;
      const result = await controller.me(req);

      expect(mockAuthService.findUserById).toHaveBeenCalledWith(42);
      expect(result).toEqual(dbUser);
    });
  });
});
