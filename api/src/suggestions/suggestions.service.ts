import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateSuggestionDto } from "./dto/create-suggestion.dto";
import { PrismaService } from "src/prisma/prisma.service";
import { SuggestionStatus } from "@prisma/client";
import { UpdateSuggestionDto } from "./dto/update-suggestion.dto";

@Injectable()
export class SuggestionsService {
  constructor(private prisma: PrismaService) { }

  async create(userId: number, createSuggestionDto: CreateSuggestionDto) {
    const { name, link, description, categoryId } = createSuggestionDto;

    const [user, category] = await Promise.all([
      this.prisma.user.findUnique({ where: { githubId: userId } }),
      this.prisma.category.findUnique({ where: { id: categoryId } }),
    ]);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return this.prisma.suggestion.create({
      data: {
        name,
        link,
        description,
        categoryId,
        userId,
        status: SuggestionStatus.PENDING,
      },
      include: {
        user: true,
        category: true,
      },
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


  async findOne(id: string) {
    const suggestion = await this.prisma.suggestion.findUnique({
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
    });

    if (!suggestion) {
      throw new NotFoundException('Suggestion not found');
    }

    return suggestion;
  }

  async update(id: string, updateSuggestionDto: UpdateSuggestionDto) {
    const suggestion = await this.prisma.suggestion.update({
      where: { id },
      data: updateSuggestionDto,
    });

    if (!suggestion) {
      throw new NotFoundException('Suggestion not found');
    }

    return suggestion;
  }

  async remove(id: string) {
    const suggestion = await this.prisma.suggestion.delete({
      where: { id },
    });

    if (!suggestion) {
      throw new NotFoundException('Suggestion not found');
    }

    return suggestion;
  }

}

