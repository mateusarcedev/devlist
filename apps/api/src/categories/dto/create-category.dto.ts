import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";


export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  @ApiProperty({
    description: 'The name of the category',
    example: 'Programming Languages',
  })
  name: string;
}
