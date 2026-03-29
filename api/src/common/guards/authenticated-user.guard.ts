import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { verify, JwtPayload } from 'jsonwebtoken';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

type NextAuthJwtPayload = JwtPayload & {
  githubId?: number | string;
};

@Injectable()
export class AuthenticatedUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<
      Request & { user?: AuthenticatedUser; cookies?: Record<string, string> }
    >();

    const token = this.extractToken(request);
    const secret = process.env.JWT_SECRET ?? process.env.NEXTAUTH_SECRET;

    if (!secret) {
      throw new UnauthorizedException('Authentication is not configured');
    }

    let decodedToken: NextAuthJwtPayload;

    try {
      decodedToken = verify(token, secret) as NextAuthJwtPayload;
    } catch {
      throw new UnauthorizedException('Invalid authentication token');
    }

    const userId = this.extractUserId(decodedToken);

    if (!userId) {
      throw new UnauthorizedException('Invalid authentication token');
    }

    request.user = { id: userId };

    return true;
  }

  private extractToken(
    request: Request & { cookies?: Record<string, string> },
  ): string {
    // 1. Cookie takes priority (browser requests with httpOnly cookie)
    const cookieToken = request.cookies?.['access_token'];
    if (cookieToken) return cookieToken;

    // 2. Authorization: Bearer header (SSR / server-side / API client requests)
    const authHeader = request.headers['authorization'];
    const headerValue = Array.isArray(authHeader) ? authHeader[0] : authHeader;

    if (!headerValue) {
      throw new UnauthorizedException('Missing authentication token');
    }

    const [scheme, ...rest] = headerValue.trim().split(' ');

    if (!scheme || scheme.toLowerCase() !== 'bearer' || rest.length === 0) {
      throw new UnauthorizedException('Invalid authentication token');
    }

    const token = rest.join(' ').trim();

    if (!token) {
      throw new UnauthorizedException('Invalid authentication token');
    }

    return token;
  }

  private extractUserId(payload: NextAuthJwtPayload): number | null {
    // New tokens use `sub`; legacy NextAuth tokens use `githubId`
    const possibleIdentifiers: Array<string | number | undefined> = [
      payload.sub,
      payload.githubId,
    ];

    for (const identifier of possibleIdentifiers) {
      if (typeof identifier === 'number' && Number.isInteger(identifier)) {
        if (identifier > 0) {
          return identifier;
        }
        continue;
      }

      if (typeof identifier === 'string') {
        const parsed = Number.parseInt(identifier, 10);

        if (!Number.isNaN(parsed) && parsed > 0) {
          return parsed;
        }
      }
    }

    return null;
  }
}
