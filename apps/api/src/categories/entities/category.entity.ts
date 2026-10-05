import { ApiProperty } from '@nestjs/swagger';
import type { Category } from 'src/generated/prisma/client'

export class CategoryEntity implements Category {

  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}
