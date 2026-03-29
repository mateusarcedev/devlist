import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ToolsService } from './tools.service';
import { CreateToolDto } from './dto/create-tool.dto';
import { UpdateToolDto } from './dto/update-tool.dto';
import {
  ApiAcceptedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ToolEntity } from './entities/tool.entity';
import { toHttpException } from 'src/common/errors/to-http-exception';

@Controller('tools')
@ApiTags('Tools')
export class ToolsController {
  constructor(private readonly toolsService: ToolsService) {}

  @Post()
  @ApiAcceptedResponse({ type: ToolEntity, isArray: true })
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
  @ApiOkResponse({ type: ToolEntity })
  async update(@Param('id') id: string, @Body() updateToolDto: UpdateToolDto) {
    const result = await this.toolsService.update(id, updateToolDto);
    if (result.isErr()) return toHttpException(result.error);
    return result.value;
  }

  @Delete(':id')
  @ApiOkResponse({ type: ToolEntity })
  async remove(@Param('id') id: string) {
    const result = await this.toolsService.remove(id);
    if (result.isErr()) return toHttpException(result.error);
    return result.value;
  }
}
