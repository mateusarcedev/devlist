import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AppError } from './app-error';

export function toHttpException(error: AppError): never {
  switch (error.type) {
    case 'NOT_FOUND':
      throw new NotFoundException(error.message);
    case 'UNAUTHORIZED':
      throw new UnauthorizedException(error.message);
    case 'FORBIDDEN':
      throw new ForbiddenException(error.message);
    case 'CONFLICT':
      throw new ConflictException(error.message);
  }
}
