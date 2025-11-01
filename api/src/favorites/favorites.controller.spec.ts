import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { PrismaService } from 'src/prisma/prisma.service';
import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';
import { FakePrismaService } from './testing/fake-prisma.service';

describe('FavoritesController (HTTP)', () => {
  describe('with mocked service', () => {
    let app: INestApplication;
    let moduleRef: TestingModule;
    let controller: FavoritesController;

    const favoritesService = {
      create: jest.fn(),
      checkFavorite: jest.fn(),
      getFavoritesByUserId: jest.fn(),
      toggleFavorite: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    beforeAll(async () => {
      moduleRef = await Test.createTestingModule({
        controllers: [FavoritesController],
        providers: [
          {
            provide: FavoritesService,
            useValue: favoritesService,
          },
        ],
      }).compile();

      app = moduleRef.createNestApplication();
      await app.init();

      controller = moduleRef.get(FavoritesController);
    });

    afterAll(async () => {
      await app.close();
      await moduleRef.close();
    });

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should reject requests without a user header', async () => {
      await request(app.getHttpServer())
        .post('/favorites/toggle')
        .send({ toolId: '11111111-1111-1111-1111-111111111111' })
        .expect(401);

      expect(favoritesService.toggleFavorite).not.toHaveBeenCalled();
    });

    it('should reject requests with an invalid user header', async () => {
      await request(app.getHttpServer())
        .post('/favorites/toggle')
        .set('x-user-id', 'invalid')
        .send({ toolId: '11111111-1111-1111-1111-111111111111' })
        .expect(401);

      expect(favoritesService.toggleFavorite).not.toHaveBeenCalled();
    });

    it('should forward valid requests to the service', async () => {
      favoritesService.toggleFavorite.mockResolvedValue({ isFavorite: true });

      await request(app.getHttpServer())
        .post('/favorites/toggle')
        .set('x-user-id', '123')
        .send({ toolId: '11111111-1111-1111-1111-111111111111' })
        .expect(200)
        .expect({ isFavorite: true });

      expect(favoritesService.toggleFavorite).toHaveBeenCalledWith(
        123,
        '11111111-1111-1111-1111-111111111111',
      );
    });
  });

  describe('with Fake Prisma', () => {
    let app: INestApplication;
    let moduleRef: TestingModule;
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

      app = moduleRef.createNestApplication();
      await app.init();
    });

    afterEach(async () => {
      await app.close();
      await moduleRef.close();
    });

    it('should respond successfully when concurrent requests favorite the same tool', async () => {
      prisma.createBarrier('favorite.findUnique', 2);

      const [first, second] = await Promise.all([
        request(app.getHttpServer())
          .post('/favorites/toggle')
          .set('x-user-id', String(userId))
          .send({ toolId })
          .expect(200),
        request(app.getHttpServer())
          .post('/favorites/toggle')
          .set('x-user-id', String(userId))
          .send({ toolId })
          .expect(200),
      ]);

      expect(first.body).toEqual({ isFavorite: true });
      expect(second.body).toEqual({ isFavorite: true });
      expect(prisma.favoriteCount()).toBe(1);
    });

    it('should respond successfully when concurrent requests unfavorite the same tool', async () => {
      prisma.seedFavorite(userId, toolId);
      prisma.createBarrier('favorite.findUnique', 2);

      const [first, second] = await Promise.all([
        request(app.getHttpServer())
          .post('/favorites/toggle')
          .set('x-user-id', String(userId))
          .send({ toolId })
          .expect(200),
        request(app.getHttpServer())
          .post('/favorites/toggle')
          .set('x-user-id', String(userId))
          .send({ toolId })
          .expect(200),
      ]);

      expect(first.body).toEqual({ isFavorite: false });
      expect(second.body).toEqual({ isFavorite: false });
      expect(prisma.favoriteCount()).toBe(0);
    });
  });
});
