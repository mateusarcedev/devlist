import { ApiProperty } from '@nestjs/swagger';
import type { Favorite } from 'src/generated/prisma/client'

export class FavoriteEntity implements Favorite {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: number;

  @ApiProperty()
  toolId: string;
}
