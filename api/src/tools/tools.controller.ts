import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ToolsService } from './tools.service';
import { CreateToolDto } from './dto/create-tool.dto';
import { UpdateToolDto } from './dto/update-tool.dto';
import { ApiAcceptedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ToolEntity } from './entities/tool.entity';
import { Tool } from '@prisma/client';

@Controller('tools')
@ApiTags("Tools")
export class ToolsController {
  constructor(private readonly toolsService: ToolsService) { }

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
  @ApiResponse({
    status: 200,
    description: 'Tools listed successfully.',
    isArray: true,
  })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  async findToolsByCategory(@Param('nameCategory') nameCategory: string): Promise<Tool[]> {
    return this.toolsService.findToolsByCategory(nameCategory);
  }


  @Get(':id')
  @ApiOkResponse({ type: ToolEntity })
  findOne(@Param('id') id: string) {
    return this.toolsService.findOne(id);
  }

  @Patch(':id')
  @ApiOkResponse({ type: ToolEntity })
  update(@Param('id') id: string, @Body() updateToolDto: UpdateToolDto) {
    return this.toolsService.update(id, updateToolDto);
  }

  @Delete(':id')
  @ApiOkResponse({ type: ToolEntity })
  remove(@Param('id') id: string) {
    return this.toolsService.remove(id);
  }
}
