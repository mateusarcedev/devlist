import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser }>();
    const userId = request.user?.id;

    if (!userId) {
      throw new ForbiddenException('Administrator access required');
    }

    const user = await this.prisma.user.findUnique({
      where: { githubId: userId },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN') {
      throw new ForbiddenException('Administrator access required');
    }

    return true;
  }
}
