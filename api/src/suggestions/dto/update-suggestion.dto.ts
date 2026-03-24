import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { SuggestionStatus } from '@prisma/client';
import { CreateSuggestionDto } from './create-suggestion.dto';

export class UpdateSuggestionDto extends PartialType(CreateSuggestionDto) {
  @IsOptional()
  @IsEnum(SuggestionStatus)
  status?: SuggestionStatus;
}
