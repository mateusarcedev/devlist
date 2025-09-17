import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";
import { UpdateFavoriteDto } from "./dto/update-favorite.dto";

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, toolId: string) {
    const [user, tool] = await Promise.all([
      this.prisma.user.findUnique({ where: { githubId: userId } }),
      this.prisma.tool.findUnique({ where: { id: toolId } }),
    ]);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (!tool) {
      throw new NotFoundException("Tool not found");
    }

    try {
      return await this.prisma.favorite.create({
        data: { userId, toolId },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException("Tool already favorited");
      }

      throw error;
    }
  }

  findOne(id: string) {
    return this.prisma.favorite.findUnique({ where: { id } });
  }

  async checkFavorite(userId: number, toolId: string) {
    const favorite = await this.prisma.favorite.findUnique({
      where: {
        userId_toolId: {
          userId,
          toolId,
        },
      },
    });
    return { isFavorite: !!favorite };
  }

  async getFavoritesByUserId(userId: number) {
    return this.prisma.favorite.findMany({
      where: { userId },
      include: { tool: true },
    });
  }

  async toggleFavorite(userId: number, toolId: string) {
    const [user, tool] = await Promise.all([
      this.prisma.user.findUnique({ where: { githubId: userId } }),
      this.prisma.tool.findUnique({ where: { id: toolId } }),
    ]);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (!tool) {
      throw new NotFoundException("Tool not found");
    }

    const existingFavorite = await this.prisma.favorite.findUnique({
      where: {
        userId_toolId: {
          userId,
          toolId,
        },
      },
    });

    if (existingFavorite) {
      await this.prisma.favorite.delete({
        where: { id: existingFavorite.id },
      });
      return { isFavorite: false };
    } else {
      await this.prisma.favorite.create({
        data: { userId, toolId },
      });
      return { isFavorite: true };
    }
  }

  update(id: string, updateFavoriteDto: UpdateFavoriteDto) {
    return this.prisma.favorite.update({
      where: { id },
      data: updateFavoriteDto,
    });
  }

  remove(id: string) {
    return this.prisma.favorite.delete({ where: { id } });
  }
}
