import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SuggestionsService } from './suggestions.service';
import { CreateSuggestionDto } from './dto/create-suggestion.dto';
import { UpdateSuggestionDto } from './dto/update-suggestion.dto';
import { ApiTags } from '@nestjs/swagger';
import { AuthenticatedUserGuard } from 'src/common/guards/authenticated-user.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/common/interfaces/authenticated-user.interface';

@Controller('suggestions')
@ApiTags("Suggestions")
export class SuggestionsController {
  constructor(private readonly suggestionsService: SuggestionsService) { }

  @UseGuards(AuthenticatedUserGuard)
  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createSuggestionDto: CreateSuggestionDto,
  ) {
    return this.suggestionsService.create(user.id, createSuggestionDto);
  }

  @Get()
  findAll() {
    return this.suggestionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.suggestionsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSuggestionDto: UpdateSuggestionDto) {
    return this.suggestionsService.update(id, updateSuggestionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.suggestionsService.remove(id);
  }
}
