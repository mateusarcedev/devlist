import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';
import { FakePrismaService } from './testing/fake-prisma.service';

describe('FavoritesController', () => {
  let controller: FavoritesController;
  let service: FavoritesService;
  let prisma: FakePrismaService;

  const userId = 123;
  const toolId = '00000000-0000-0000-0000-000000000001';

  beforeEach(() => {
    prisma = new FakePrismaService();
    prisma.seedUser(userId);
    prisma.seedTool(toolId);

    service = new FavoritesService(prisma as any);
    controller = new FavoritesController(service);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('toggleFavorite', () => {
    it('should respond successfully when concurrent requests favorite the same tool', async () => {
      prisma.createBarrier('favorite.findFirst', 2);

      const [first, second] = await Promise.all([
        controller.toggleFavorite(userId, toolId),
        controller.toggleFavorite(userId, toolId),
      ]);

      expect(first).toEqual({ isFavorite: true });
      expect(second).toEqual({ isFavorite: true });
      expect(prisma.favoriteCount()).toBe(1);
    });

    it('should respond successfully when concurrent requests unfavorite the same tool', async () => {
      prisma.seedFavorite(userId, toolId);
      prisma.createBarrier('favorite.findFirst', 2);

      const [first, second] = await Promise.all([
        controller.toggleFavorite(userId, toolId),
        controller.toggleFavorite(userId, toolId),
      ]);

      expect(first).toEqual({ isFavorite: false });
      expect(second).toEqual({ isFavorite: false });
      expect(prisma.favoriteCount()).toBe(0);
    });
  });
});
