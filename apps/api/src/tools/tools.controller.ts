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
import { ToolsService } from './tools.service';
import { CreateToolDto } from './dto/create-tool.dto';
import { UpdateToolDto } from './dto/update-tool.dto';
import {
  ApiAcceptedResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ToolEntity } from './entities/tool.entity';
import { toHttpException } from 'src/common/errors/to-http-exception';
import { AuthenticatedUserGuard } from 'src/common/guards/authenticated-user.guard';
import { AdminGuard } from 'src/common/guards/admin.guard';

@Controller('tools')
@ApiTags('Tools')
export class ToolsController {
  constructor(private readonly toolsService: ToolsService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(AuthenticatedUserGuard, AdminGuard)
  @ApiAcceptedResponse({ type: ToolEntity, isArray: true })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Administrator access required.' })
  create(@Body() createToolDto: CreateToolDto | CreateToolDto[]) {
    if (Array.isArray(createToolDto)) {
      return this.toolsService.create(createToolDto);
    } else {
      return this.toolsService.create([createToolDto]);
    }
  }

  @Get()
  @ApiOkResponse({ type: ToolEntity, isArray: true })
  findAll() {
    return this.toolsService.findAll();
  }

  @Get('category/:nameCategory')
  @ApiOperation({ summary: 'Search tools by category' })
  @ApiParam({ name: 'nameCategory', description: 'category name', type: String })
  @ApiResponse({ status: 200, description: 'Tools listed successfully.', isArray: true })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  async findToolsByCategory(@Param('nameCategory') nameCategory: string) {
    const result = await this.toolsService.findToolsByCategory(nameCategory);
    if (result.isErr()) return toHttpException(result.error);
    return result.value;
  }

  @Get(':id')
  @ApiOkResponse({ type: ToolEntity })
  async findOne(@Param('id') id: string) {
    const result = await this.toolsService.findOne(id);
    if (result.isErr()) return toHttpException(result.error);
    return result.value;
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(AuthenticatedUserGuard, AdminGuard)
  @ApiOkResponse({ type: ToolEntity })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Administrator access required.' })
  async update(@Param('id') id: string, @Body() updateToolDto: UpdateToolDto) {
    const result = await this.toolsService.update(id, updateToolDto);
    if (result.isErr()) return toHttpException(result.error);
    return result.value;
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(AuthenticatedUserGuard, AdminGuard)
  @ApiOkResponse({ type: ToolEntity })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Administrator access required.' })
  async remove(@Param('id') id: string) {
    const result = await this.toolsService.remove(id);
    if (result.isErr()) return toHttpException(result.error);
    return result.value;
  }
}
