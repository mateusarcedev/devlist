import { Injectable } from '@nestjs/common';
import { ResultAsync, ok, err } from 'neverthrow';
import { AppError } from 'src/common/errors/app-error';
import { CreateSuggestionDto } from './dto/create-suggestion.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { SuggestionStatus } from '@prisma/client';
import { UpdateSuggestionDto } from './dto/update-suggestion.dto';

@Injectable()
export class SuggestionsService {
  constructor(private prisma: PrismaService) {}

  create(userId: number, createSuggestionDto: CreateSuggestionDto): ResultAsync<any, AppError> {
    const { name, link, description, categoryId } = createSuggestionDto;

    return ResultAsync.fromPromise(
      Promise.all([
        this.prisma.user.findUnique({ where: { githubId: userId } }),
        this.prisma.category.findUnique({ where: { id: categoryId } }),
      ]),
      () => ({ type: 'NOT_FOUND' as const, message: 'Error fetching user or category' }),
    ).andThen(([user, category]) => {
      if (!user) return err({ type: 'NOT_FOUND' as const, message: 'User not found' });
      if (!category) return err({ type: 'NOT_FOUND' as const, message: 'Category not found' });

      return ResultAsync.fromPromise(
        this.prisma.suggestion.create({
          data: { name, link, description, categoryId, userId, status: SuggestionStatus.PENDING },
          include: { user: true, category: true },
        }),
        () => ({ type: 'NOT_FOUND' as const, message: 'Error creating suggestion' }),
      );
    });
  }

  async findAll() {
    return this.prisma.suggestion.findMany({
      include: {
        user: {
          select: {
            name: true,
            avatar: true,
            email: true,
          },
        },
        category: true,
        tool: true,
      },
    });
  }

  findOne(id: string): ResultAsync<any, AppError> {
    return ResultAsync.fromPromise(
      this.prisma.suggestion.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              name: true,
              avatar: true,
              email: true,
            },
          },
          category: true,
          tool: true,
        },
      }),
      () => ({ type: 'NOT_FOUND' as const, message: 'Suggestion not found' }),
    ).andThen(suggestion =>
      suggestion
        ? ok(suggestion)
        : err({ type: 'NOT_FOUND' as const, message: 'Suggestion not found' }),
    );
  }

  async update(id: string, updateSuggestionDto: UpdateSuggestionDto) {
    return this.prisma.suggestion.update({
      where: { id },
      data: updateSuggestionDto,
    });
  }

  async remove(id: string) {
    return this.prisma.suggestion.delete({
      where: { id },
    });
  }
}
