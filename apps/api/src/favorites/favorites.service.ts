import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";
import { UpdateFavoriteDto } from "./dto/update-favorite.dto";

type PrismaTransactionClient = Parameters<
  Parameters<PrismaService["$transaction"]>[0]
>[0];

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  private async validateUserAndTool(
    userId: number,
    toolId: string,
    tx: PrismaTransactionClient | PrismaService = this.prisma
  ) {
    const [user, tool] = await Promise.all([
      tx.user.findUnique({ where: { githubId: userId } }),
      tx.tool.findUnique({ where: { id: toolId } }),
    ]);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (!tool) {
      throw new NotFoundException("Tool not found");
    }
  }

  async create(userId: number, toolId: string) {
    await this.validateUserAndTool(userId, toolId);

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
    return this.prisma.$transaction(async (tx) => {
      await this.validateUserAndTool(userId, toolId, tx);

      const existingFavorite = await tx.favorite.findUnique({
        where: {
          userId_toolId: {
            userId,
            toolId,
          },
        },
      });

      if (existingFavorite) {
        await tx.favorite.deleteMany({
          where: {
            userId,
            toolId,
          },
        });

        return { isFavorite: false };
      }

      try {
        await tx.favorite.create({
          data: { userId, toolId },
        });

        return { isFavorite: true };
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          return { isFavorite: true };
        }

        throw error;
      }
    });
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
