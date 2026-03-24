import { Prisma } from '@prisma/client';
import { Barrier } from 'src/common/testing/barrier';

type FavoriteRecord = { id: string; userId: number; toolId: string };

export class FakePrismaService {
  private users = new Map<number, { githubId: number }>();
  private tools = new Map<string, { id: string }>();
  private favorites = new Map<string, FavoriteRecord>();
  private barriers = new Map<string, Barrier>();
  private idCounter = 0;

  user = {
    findUnique: this.userFindUnique.bind(this),
  };

  tool = {
    findUnique: this.toolFindUnique.bind(this),
  };

  favorite = {
    findFirst: this.favoriteFindFirst.bind(this),
    findUnique: this.favoriteFindUnique.bind(this),
    create: this.favoriteCreate.bind(this),
    deleteMany: this.favoriteDeleteMany.bind(this),
  };

  async $transaction<T>(callback: (tx: any) => Promise<T>) {
    return callback({
      user: { findUnique: this.userFindUnique.bind(this) },
      tool: { findUnique: this.toolFindUnique.bind(this) },
      favorite: {
        findFirst: this.favoriteFindFirst.bind(this),
        findUnique: this.favoriteFindUnique.bind(this),
        create: this.favoriteCreate.bind(this),
        deleteMany: this.favoriteDeleteMany.bind(this),
      },
    });
  }

  seedUser(id: number) {
    this.users.set(id, { githubId: id });
  }

  seedTool(id: string) {
    this.tools.set(id, { id });
  }

  seedFavorite(userId: number, toolId: string) {
    const key = this.favoriteKey(userId, toolId);
    this.favorites.set(key, {
      id: `fav-${++this.idCounter}`,
      userId,
      toolId,
    });
  }

  favoriteCount() {
    return this.favorites.size;
  }

  createBarrier(name: string, parties: number) {
    this.barriers.set(name, new Barrier(parties));
  }

  private async waitOnBarrier(name: string) {
    const barrier = this.barriers.get(name);
    if (!barrier) {
      return;
    }

    await barrier.wait();

    if (barrier.isReleased()) {
      this.barriers.delete(name);
    }
  }

  private favoriteKey(userId: number, toolId: string) {
    return `${userId}:${toolId}`;
  }

  private async userFindUnique(args: { where: { githubId?: number; id?: number } }) {
    await Promise.resolve();
    const { where } = args;

    if (where.githubId !== undefined) {
      return this.users.get(where.githubId) ?? null;
    }

    if (where.id !== undefined) {
      return this.users.get(where.id) ?? null;
    }

    return null;
  }

  private async toolFindUnique(args: { where: { id: string } }) {
    await Promise.resolve();
    return this.tools.get(args.where.id) ?? null;
  }

  private async favoriteFindUnique(args: {
    where:
      | { userId_toolId: { userId: number; toolId: string } }
      | { id: string };
  }) {
    await this.waitOnBarrier('favorite.findUnique');
    await this.waitOnBarrier('favorite.findFirst');
    await Promise.resolve();

    if ('userId_toolId' in args.where) {
      const { userId, toolId } = args.where.userId_toolId;
      return this.favorites.get(this.favoriteKey(userId, toolId)) ?? null;
    }

    const { id } = args.where as { id: string };
    for (const favorite of this.favorites.values()) {
      if (favorite.id === id) {
        return favorite;
      }
    }

    return null;
  }

  private async favoriteFindFirst(args: { where?: { userId?: number; toolId?: string } }) {
    await this.waitOnBarrier('favorite.findUnique');
    await this.waitOnBarrier('favorite.findFirst');
    await Promise.resolve();

    const { where } = args;
    if (!where) {
      const [first] = this.favorites.values();
      return first ?? null;
    }

    const { userId, toolId } = where;

    if (userId !== undefined && toolId !== undefined) {
      return this.favorites.get(this.favoriteKey(userId, toolId)) ?? null;
    }

    for (const favorite of this.favorites.values()) {
      if (
        (userId === undefined || favorite.userId === userId) &&
        (toolId === undefined || favorite.toolId === toolId)
      ) {
        return favorite;
      }
    }

    return null;
  }

  private async favoriteCreate(args: { data: { userId: number; toolId: string } }) {
    await Promise.resolve();
    const { userId, toolId } = args.data;
    const key = this.favoriteKey(userId, toolId);

    if (this.favorites.has(key)) {
      throw new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'fake',
      });
    }

    const favorite = { id: `fav-${++this.idCounter}`, userId, toolId };
    this.favorites.set(key, favorite);
    return favorite;
  }

  private async favoriteDeleteMany(args: { where: { userId: number; toolId: string } }) {
    await Promise.resolve();
    const { userId, toolId } = args.where;
    const key = this.favoriteKey(userId, toolId);
    const existed = this.favorites.delete(key);
    return { count: existed ? 1 : 0 };
  }
}
