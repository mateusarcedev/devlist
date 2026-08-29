import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { createHash } from 'crypto';

const mockPrisma = {
  user: {
    upsert: jest.fn(),
    findUnique: jest.fn(),
  },
  refreshToken: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
};

const mockJwtService = {
  sign: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('upsertUser', () => {
    it('should upsert the user and return it', async () => {
      const profile = { githubId: 42, name: 'Alice', email: 'a@a.com', avatar: 'https://avatar.url' };
      const user = { ...profile, role: 'USER' };
      mockPrisma.user.upsert.mockResolvedValue(user);

      const result = await service.upsertUser(profile);

      expect(result).toEqual(user);
      expect(mockPrisma.user.upsert).toHaveBeenCalledWith({
        where: { githubId: 42 },
        update: { name: 'Alice', email: 'a@a.com', avatar: 'https://avatar.url' },
        create: { githubId: 42, name: 'Alice', email: 'a@a.com', avatar: 'https://avatar.url' },
      });
    });
  });

  describe('generateTokens', () => {
    it('should return an accessToken (from JwtService) and a raw refreshToken (UUID)', async () => {
      mockJwtService.sign.mockReturnValue('signed.jwt.token');
      mockPrisma.refreshToken.create.mockResolvedValue({});

      const result = await service.generateTokens(42, 'USER');

      expect(result.accessToken).toBe('signed.jwt.token');
      expect(typeof result.refreshToken).toBe('string');
      expect(result.refreshToken.length).toBeGreaterThan(10);

      expect(mockJwtService.sign).toHaveBeenCalledWith({ sub: 42, role: 'USER' });
      expect(mockPrisma.refreshToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 42,
            tokenHash: expect.any(String),
            expiresAt: expect.any(Date),
          }),
        }),
      );
    });

    it('should store the SHA-256 hash of the refresh token, not the raw value', async () => {
      mockJwtService.sign.mockReturnValue('signed.jwt.token');
      let storedHash: string | undefined;
      mockPrisma.refreshToken.create.mockImplementation(({ data }: { data: { tokenHash: string } }) => {
        storedHash = data.tokenHash;
        return Promise.resolve({});
      });

      const result = await service.generateTokens(42, 'USER');
      const expectedHash = createHash('sha256').update(result.refreshToken).digest('hex');

      expect(storedHash).toBe(expectedHash);
    });
  });

  describe('refresh', () => {
    const rawToken = 'raw-uuid-token';
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const futureDate = new Date(Date.now() + 1000 * 60 * 60);

    it('should return new tokens when refresh token is valid', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        id: '1', tokenHash, userId: 42, expiresAt: futureDate, usedAt: null,
      });
      mockPrisma.refreshToken.update.mockResolvedValue({});
      mockPrisma.user.findUnique.mockResolvedValue({ githubId: 42, role: 'USER' });
      mockJwtService.sign.mockReturnValue('new.access.token');
      mockPrisma.refreshToken.create.mockResolvedValue({});

      const result = await service.refresh(rawToken);

      expect(result.accessToken).toBe('new.access.token');
      expect(typeof result.refreshToken).toBe('string');
      expect(mockPrisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { usedAt: expect.any(Date) },
      });
    });

    it('should throw UnauthorizedException when token is not found', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue(null);
      await expect(service.refresh(rawToken)).rejects.toThrow('Invalid or expired refresh token');
    });

    it('should throw UnauthorizedException when token is expired', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        id: '1', tokenHash, userId: 42, expiresAt: new Date(Date.now() - 1000), usedAt: null,
      });
      await expect(service.refresh(rawToken)).rejects.toThrow('Invalid or expired refresh token');
    });

    it('should revoke all tokens and throw on reuse detection', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        id: '1', tokenHash, userId: 42, expiresAt: futureDate, usedAt: new Date(),
      });
      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 2 });

      await expect(service.refresh(rawToken)).rejects.toThrow('Token reuse detected');
      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 42, usedAt: null },
        data: { usedAt: expect.any(Date) },
      });
    });
  });

  describe('logout', () => {
    it('should mark the refresh token as used', async () => {
      const rawToken = 'logout-token';
      const hash = createHash('sha256').update(rawToken).digest('hex');
      mockPrisma.refreshToken.update.mockResolvedValue({});

      await service.logout(rawToken);

      expect(mockPrisma.refreshToken.update).toHaveBeenCalledWith({
        where: { tokenHash: hash },
        data: { usedAt: expect.any(Date) },
      });
    });

    it('should not throw if token is not found (already logged out)', async () => {
      mockPrisma.refreshToken.update.mockRejectedValue({ code: 'P2025' });
      await expect(service.logout('nonexistent')).resolves.not.toThrow();
    });
  });
});
