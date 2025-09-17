import { IsNotEmpty, IsString } from 'class-validator';

export class CreateSuggestionDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  link: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsString()
  categoryId: string;

}
