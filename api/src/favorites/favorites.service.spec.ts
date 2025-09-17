import { FavoritesService } from './favorites.service';
import { FakePrismaService } from './testing/fake-prisma.service';

describe('FavoritesService', () => {
  let service: FavoritesService;
  let prisma: FakePrismaService;

  const userId = 123;
  const toolId = '00000000-0000-0000-0000-000000000001';

  beforeEach(() => {
    prisma = new FakePrismaService();
    prisma.seedUser(userId);
    prisma.seedTool(toolId);

    service = new FavoritesService(prisma as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('toggleFavorite', () => {
    it('should resolve concurrent favorite toggles without conflicts', async () => {
      prisma.createBarrier('favorite.findUnique', 2);

      const [first, second] = await Promise.all([
        service.toggleFavorite(userId, toolId),
        service.toggleFavorite(userId, toolId),
      ]);

      expect(first).toEqual({ isFavorite: true });
      expect(second).toEqual({ isFavorite: true });
      expect(prisma.favoriteCount()).toBe(1);
    });

    it('should resolve concurrent unfavorite toggles without conflicts', async () => {
      prisma.seedFavorite(userId, toolId);
      prisma.createBarrier('favorite.findUnique', 2);

      const [first, second] = await Promise.all([
        service.toggleFavorite(userId, toolId),
        service.toggleFavorite(userId, toolId),
      ]);

      expect(first).toEqual({ isFavorite: false });
      expect(second).toEqual({ isFavorite: false });
      expect(prisma.favoriteCount()).toBe(0);
    });
  });
});
