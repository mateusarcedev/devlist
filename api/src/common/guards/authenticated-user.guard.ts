import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

@Injectable()
export class AuthenticatedUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<
      Request & { user?: AuthenticatedUser }
    >();

    const headerValue = request.headers['x-user-id'];
    const userIdHeader = Array.isArray(headerValue)
      ? headerValue[0]
      : headerValue;

    if (!userIdHeader) {
      throw new UnauthorizedException('Missing user identifier');
    }

    const parsedUserId = Number.parseInt(userIdHeader, 10);

    if (Number.isNaN(parsedUserId) || parsedUserId <= 0) {
      throw new UnauthorizedException('Invalid user identifier');
    }

    request.user = { id: parsedUserId };

    return true;
  }
}
