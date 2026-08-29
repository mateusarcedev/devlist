import { ApiProperty } from '@nestjs/swagger';
import { Favorite } from '@prisma/client'

export class FavoriteEntity implements Favorite {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: number;

  @ApiProperty()
  toolId: string;
}
