import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateToolDto } from './dto/create-tool.dto';
import { UpdateToolDto } from './dto/update-tool.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ToolsService {
  constructor(private prisma: PrismaService) { }


  async create(createToolDtos: CreateToolDto[]) {

    return this.prisma.tool.createMany({
      data: createToolDtos.map(dto => ({
        name: dto.name,
        link: dto.link,
        description: dto.description,
        categoryId: dto.categoryId,
      })),
    });
  }


  async findAll() {
    return this.prisma.tool.findMany();
  }

  async findToolsByCategory(nameCategory: string) {
    const decodedName = decodeURIComponent(nameCategory);
    
    const category = await this.prisma.category.findFirst({
      where: { 
        name: {
          equals: decodedName,
          mode: 'insensitive' 
        }
      },
      select: { id: true },
    });
    
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    
    return this.prisma.tool.findMany({
      where: { categoryId: category.id },
    });
  }
  
  


  async findOne(id: string) {
    const tool = await this.prisma.tool.findUnique({ where: { id } });
    if (!tool) {
      throw new NotFoundException('Tool not found');
    }
    return tool;
  }


  async update(id: string, updateToolDto: UpdateToolDto) {
    const tool = await this.prisma.tool.findUnique({ where: { id } });
    if (!tool) {
      throw new NotFoundException('Tool not found');
    }
    return this.prisma.tool.update({
      where: { id },
      data: updateToolDto,
    });
  }


  async remove(id: string) {
    const tool = await this.prisma.tool.findUnique({ where: { id } });
    if (!tool) {
      throw new NotFoundException('Tool not found');
    }
    return this.prisma.tool.delete({ where: { id } });
  }
}
