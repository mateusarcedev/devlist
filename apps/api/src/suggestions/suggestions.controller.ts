import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { SuggestionsService } from './suggestions.service';
import { CreateSuggestionDto } from './dto/create-suggestion.dto';
import { UpdateSuggestionDto } from './dto/update-suggestion.dto';
import { AuthenticatedUserGuard } from 'src/common/guards/authenticated-user.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/common/interfaces/authenticated-user.interface';
import { ApiTags } from '@nestjs/swagger';
import { toHttpException } from 'src/common/errors/to-http-exception';

@Controller('suggestions')
@ApiTags('Suggestions')
export class SuggestionsController {
  constructor(private readonly suggestionsService: SuggestionsService) {}

  @Post()
  @UseGuards(AuthenticatedUserGuard)
  async create(
    @Body() createSuggestionDto: CreateSuggestionDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    const result = await this.suggestionsService.create(
      currentUser.id,
      createSuggestionDto,
    );
    if (result.isErr()) return toHttpException(result.error);
    return result.value;
  }

  @Get()
  findAll() {
    return this.suggestionsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.suggestionsService.findOne(id);
    if (result.isErr()) return toHttpException(result.error);
    return result.value;
  }

  @Patch(':id')
  @UseGuards(AuthenticatedUserGuard)
  async update(
    @Param('id') id: string,
    @Body() updateSuggestionDto: UpdateSuggestionDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    const findResult = await this.suggestionsService.findOne(id);
    if (findResult.isErr()) return toHttpException(findResult.error);

    if (findResult.value.userId !== currentUser.id) {
      throw new ForbiddenException('You are not allowed to update this suggestion');
    }

    return this.suggestionsService.update(id, updateSuggestionDto);
  }

  @Delete(':id')
  @UseGuards(AuthenticatedUserGuard)
  async remove(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    const findResult = await this.suggestionsService.findOne(id);
    if (findResult.isErr()) return toHttpException(findResult.error);

    if (findResult.value.userId !== currentUser.id) {
      throw new ForbiddenException('You are not allowed to delete this suggestion');
    }

    return this.suggestionsService.remove(id);
  }
}
