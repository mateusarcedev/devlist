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
      Request & { user?: AuthenticatedUser }
    >();

    const token = this.extractBearerToken(request);
    const secret = process.env.NEXTAUTH_SECRET;

    if (!secret) {
      throw new UnauthorizedException('Authentication is not configured');
    }

    let decodedToken: NextAuthJwtPayload;

    try {
      decodedToken = verify(token, secret) as NextAuthJwtPayload;
    } catch (error) {
      throw new UnauthorizedException('Invalid authentication token');
    }

    const userId = this.extractUserId(decodedToken);

    if (!userId) {
      throw new UnauthorizedException('Invalid authentication token');
    }

    request.user = { id: userId };

    return true;
  }

  private extractBearerToken(
    request: Request,
  ): string {
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
    const possibleIdentifiers: Array<string | number | undefined> = [
      payload.githubId,
      payload.sub,
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
