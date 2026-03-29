import { Injectable } from '@nestjs/common';
import { ResultAsync, ok, err } from 'neverthrow';
import { Tool } from '@prisma/client';
import { AppError } from 'src/common/errors/app-error';
import { CreateToolDto } from './dto/create-tool.dto';
import { UpdateToolDto } from './dto/update-tool.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ToolsService {
  constructor(private prisma: PrismaService) {}

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

  findToolsByCategory(nameCategory: string): ResultAsync<Tool[], AppError> {
    const decodedName = decodeURIComponent(nameCategory);
    return ResultAsync.fromPromise(
      this.prisma.category.findFirst({
        where: { name: { equals: decodedName, mode: 'insensitive' } },
        select: { id: true },
      }),
      () => ({ type: 'NOT_FOUND' as const, message: 'Category not found' }),
    ).andThen(category =>
      category
        ? ResultAsync.fromPromise(
            this.prisma.tool.findMany({ where: { categoryId: category.id } }),
            () => ({ type: 'NOT_FOUND' as const, message: 'Category not found' }),
          )
        : err({ type: 'NOT_FOUND' as const, message: 'Category not found' }),
    );
  }

  findOne(id: string): ResultAsync<Tool, AppError> {
    return ResultAsync.fromPromise(
      this.prisma.tool.findUnique({ where: { id } }),
      () => ({ type: 'NOT_FOUND' as const, message: 'Tool not found' }),
    ).andThen(tool =>
      tool ? ok(tool) : err({ type: 'NOT_FOUND' as const, message: 'Tool not found' }),
    );
  }

  update(id: string, updateToolDto: UpdateToolDto): ResultAsync<Tool, AppError> {
    return ResultAsync.fromPromise(
      this.prisma.tool.findUnique({ where: { id } }),
      () => ({ type: 'NOT_FOUND' as const, message: 'Tool not found' }),
    ).andThen(tool =>
      tool
        ? ResultAsync.fromPromise(
            this.prisma.tool.update({ where: { id }, data: updateToolDto }),
            () => ({ type: 'NOT_FOUND' as const, message: 'Tool not found' }),
          )
        : err({ type: 'NOT_FOUND' as const, message: 'Tool not found' }),
    );
  }

  remove(id: string): ResultAsync<Tool, AppError> {
    return ResultAsync.fromPromise(
      this.prisma.tool.findUnique({ where: { id } }),
      () => ({ type: 'NOT_FOUND' as const, message: 'Tool not found' }),
    ).andThen(tool =>
      tool
        ? ResultAsync.fromPromise(
            this.prisma.tool.delete({ where: { id } }),
            () => ({ type: 'NOT_FOUND' as const, message: 'Tool not found' }),
          )
        : err({ type: 'NOT_FOUND' as const, message: 'Tool not found' }),
    );
  }
}
