import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { GithubOAuthGuard } from './guards/github-oauth.guard';
import { AuthenticatedUserGuard } from 'src/common/guards/authenticated-user.guard';
import { GithubUser } from './strategies/github.strategy';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const ACCESS_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: IS_PRODUCTION,
  sameSite: 'strict' as const,
  maxAge: 15 * 60 * 1000,
  path: '/',
};

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: IS_PRODUCTION,
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/auth/refresh',
};

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Redirect to GitHub OAuth' })
  @UseGuards(GithubOAuthGuard)
  @Get('github')
  github(): void {
    // Passport redirects — this body never executes
  }

  @ApiOperation({ summary: 'GitHub OAuth callback' })
  @UseGuards(GithubOAuthGuard)
  @Get('callback/github')
  async githubCallback(
    @Req() req: Request & { user: GithubUser },
    @Res() res: Response,
  ): Promise<void> {
    try {
      const dbUser = await this.authService.upsertUser(req.user);
      const { accessToken, refreshToken } = await this.authService.generateTokens(
        dbUser.githubId,
        dbUser.role,
      );

      res.cookie('access_token', accessToken, ACCESS_COOKIE_OPTIONS);
      res.cookie('refresh_token', refreshToken, REFRESH_COOKIE_OPTIONS);
      res.redirect(process.env.FRONTEND_URL ?? 'http://localhost:3000');
    } catch {
      res.redirect(
        `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/login?error=auth_failed`,
      );
    }
  }

  @ApiOperation({ summary: 'Refresh access token' })
  @Post('refresh')
  async refresh(@Req() req: Request, @Res() res: Response): Promise<void> {
    const rawToken = (req as any).cookies?.['refresh_token'];

    if (!rawToken) {
      res.status(401).json({ message: 'Missing refresh token' });
      return;
    }

    try {
      const { accessToken, refreshToken } = await this.authService.refresh(rawToken);
      res.cookie('access_token', accessToken, ACCESS_COOKIE_OPTIONS);
      res.cookie('refresh_token', refreshToken, REFRESH_COOKIE_OPTIONS);
      res.json({ ok: true });
    } catch {
      res.clearCookie('access_token', { path: '/' });
      res.clearCookie('refresh_token', { path: '/auth/refresh' });
      res.status(401).json({ message: 'Invalid or expired session' });
    }
  }

  @ApiOperation({ summary: 'Logout — revoke refresh token and clear cookies' })
  @Post('logout')
  async logout(@Req() req: Request, @Res() res: Response): Promise<void> {
    const rawToken = (req as any).cookies?.['refresh_token'];
    if (rawToken) {
      await this.authService.logout(rawToken);
    }
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/auth/refresh' });
    res.json({ ok: true });
  }

  @ApiOperation({ summary: 'Get current authenticated user' })
  @UseGuards(AuthenticatedUserGuard)
  @Get('me')
  async me(@Req() req: Request): Promise<unknown> {
    const userId = (req as any).user?.id as number;
    return this.authService.findUserById(userId);
  }
}
