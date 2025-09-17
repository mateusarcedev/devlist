import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateFavoriteDto {
  @IsNotEmpty()
  @IsUUID()
  @ApiProperty({
    description: 'The ID of the tool being favorited',
    example: 'tool-uuid',
  })
  toolId: string;
}
