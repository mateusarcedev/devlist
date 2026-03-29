import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomUUID } from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';
import { GithubUser } from './strategies/github.strategy';
import { UserRole } from '@prisma/client';

const REFRESH_TOKEN_TTL_DAYS = 7;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async upsertUser(profile: GithubUser) {
    const { githubId, name, email, avatar } = profile;
    return this.prisma.user.upsert({
      where: { githubId },
      update: { name, email, avatar },
      create: { githubId, name, email, avatar },
    });
  }

  async generateTokens(
    userId: number,
    role: UserRole | string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = this.jwtService.sign({ sub: userId, role });

    const rawToken = randomUUID();
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(
      Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
    );

    await this.prisma.refreshToken.create({
      data: { tokenHash, userId, expiresAt },
    });

    return { accessToken, refreshToken: rawToken };
  }

  async refresh(
    rawToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (stored.usedAt !== null) {
      await this.prisma.refreshToken.updateMany({
        where: { userId: stored.userId, usedAt: null },
        data: { usedAt: new Date() },
      });
      throw new UnauthorizedException('Token reuse detected');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { usedAt: new Date() },
    });

    const user = await this.prisma.user.findUnique({
      where: { githubId: stored.userId },
    });

    return this.generateTokens(stored.userId, user?.role ?? 'USER');
  }

  async logout(rawToken: string): Promise<void> {
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    try {
      await this.prisma.refreshToken.update({
        where: { tokenHash },
        data: { usedAt: new Date() },
      });
    } catch {
      // Token not found — already logged out, no-op
    }
  }

  async findUserById(userId: number) {
    return this.prisma.user.findUnique({ where: { githubId: userId } });
  }
}
