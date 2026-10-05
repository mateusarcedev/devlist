import { ApiProperty } from '@nestjs/swagger';
import type { $Enums, User } from 'src/generated/prisma/client'


export class UserEntity implements User {
  @ApiProperty()
  githubId: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  avatar: string;

  @ApiProperty()
  role: $Enums.UserRole;
}
