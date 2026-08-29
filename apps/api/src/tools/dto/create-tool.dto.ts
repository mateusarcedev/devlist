import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUrl } from 'class-validator';

export class CreateToolDto {
  @IsNotEmpty()
  @ApiProperty({ example: 'Example Tool' })
  name: string;

  @IsNotEmpty()
  @IsUrl()
  @ApiProperty({ example: 'https://example.com/tool' })
  link: string;

  @IsNotEmpty()
  @ApiProperty({ example: 'This tool does amazing things!' })
  description: string;

  @IsNotEmpty()
  @ApiProperty({ example: 'category-uuid' })
  categoryId: string;

  @ApiProperty({ example: 'user-uuid' })
  suggestedBy?: string;
}
