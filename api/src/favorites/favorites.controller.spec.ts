import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';
import { FakePrismaService } from './testing/fake-prisma.service';

describe('FavoritesController', () => {
  let moduleRef: TestingModule;
  let controller: FavoritesController;
  let prisma: FakePrismaService;

  const userId = 123;
  const toolId = '00000000-0000-0000-0000-000000000001';

  beforeEach(async () => {
    prisma = new FakePrismaService();
    prisma.seedUser(userId);
    prisma.seedTool(toolId);

    moduleRef = await Test.createTestingModule({
      controllers: [FavoritesController],
      providers: [
        FavoritesService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    controller = moduleRef.get(FavoritesController);
  });

  afterEach(async () => {
    await moduleRef?.close();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('toggleFavorite', () => {
    it('should respond successfully when concurrent requests favorite the same tool', async () => {
      prisma.createBarrier('favorite.findUnique', 2);

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
      prisma.createBarrier('favorite.findUnique', 2);

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
