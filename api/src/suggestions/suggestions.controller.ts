import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
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

  @UseGuards(AuthenticatedUserGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateSuggestionDto: UpdateSuggestionDto,
    @CurrentUser('id') currentUserId: number,
  ) {
    const suggestion = await this.suggestionsService.findOne(id);

    if (suggestion.userId !== currentUserId) {
      throw new ForbiddenException();
    }

    return this.suggestionsService.update(id, updateSuggestionDto);
  }

  @UseGuards(AuthenticatedUserGuard)
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') currentUserId: number,
  ) {
    const suggestion = await this.suggestionsService.findOne(id);

    if (suggestion.userId !== currentUserId) {
      throw new ForbiddenException();
    }

    return this.suggestionsService.remove(id);
  }
}
