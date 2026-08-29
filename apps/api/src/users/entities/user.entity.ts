import { ApiProperty } from '@nestjs/swagger';
import { $Enums, User } from '@prisma/client'


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
