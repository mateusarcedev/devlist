import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { sign } from 'jsonwebtoken';
import { PrismaService } from 'src/prisma/prisma.service';
import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';
import { FakePrismaService } from './testing/fake-prisma.service';

const secret = 'test-secret';
const createToken = (payload: Record<string, unknown> = {}) =>
  sign({ githubId: 123, ...payload }, secret);

describe('FavoritesController (HTTP)', () => {
  describe('toggle and create with JWT auth', () => {
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
      process.env.NEXTAUTH_SECRET = secret;

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
      delete process.env.NEXTAUTH_SECRET;
    });

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should reject toggle without authorization header', async () => {
      await request(app.getHttpServer())
        .post('/favorites/toggle')
        .send({ toolId: '11111111-1111-1111-1111-111111111111' })
        .expect(401);

      expect(favoritesService.toggleFavorite).not.toHaveBeenCalled();
    });

    it('should reject toggle with an invalid token', async () => {
      await request(app.getHttpServer())
        .post('/favorites/toggle')
        .set('Authorization', 'Bearer invalid-token')
        .send({ toolId: '11111111-1111-1111-1111-111111111111' })
        .expect(401);

      expect(favoritesService.toggleFavorite).not.toHaveBeenCalled();
    });

    it('should forward toggle to the service with a valid token', async () => {
      favoritesService.toggleFavorite.mockResolvedValue({ isFavorite: true });

      const token = createToken();

      await request(app.getHttpServer())
        .post('/favorites/toggle')
        .set('Authorization', `Bearer ${token}`)
        .send({ toolId: '11111111-1111-1111-1111-111111111111' })
        .expect(200)
        .expect({ isFavorite: true });

      expect(favoritesService.toggleFavorite).toHaveBeenCalledWith(
        123,
        '11111111-1111-1111-1111-111111111111',
      );
    });

    describe('GET /favorites/:id', () => {
      it('should reject without authorization header', async () => {
        await request(app.getHttpServer())
          .get('/favorites/some-favorite-id')
          .expect(401);

        expect(favoritesService.findOne).not.toHaveBeenCalled();
      });

      it('should return favorite to authenticated user', async () => {
        favoritesService.findOne.mockResolvedValue({ id: 'some-favorite-id', userId: 123 });

        const token = createToken();

        await request(app.getHttpServer())
          .get('/favorites/some-favorite-id')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        expect(favoritesService.findOne).toHaveBeenCalledWith('some-favorite-id');
      });
    });

    describe('DELETE /favorites/:id', () => {
      it('should reject deletion without authorization header', async () => {
        await request(app.getHttpServer())
          .delete('/favorites/some-favorite-id')
          .expect(401);

        expect(favoritesService.remove).not.toHaveBeenCalled();
      });

      it('should reject deletion from a user who does not own the favorite', async () => {
        favoritesService.findOne.mockResolvedValue({ id: 'some-favorite-id', userId: 999 });

        const token = createToken();

        await request(app.getHttpServer())
          .delete('/favorites/some-favorite-id')
          .set('Authorization', `Bearer ${token}`)
          .expect(403);

        expect(favoritesService.remove).not.toHaveBeenCalled();
      });

      it('should allow deletion from the favorite owner', async () => {
        favoritesService.findOne.mockResolvedValue({ id: 'some-favorite-id', userId: 123 });
        favoritesService.remove.mockResolvedValue({ id: 'some-favorite-id' });

        const token = createToken();

        await request(app.getHttpServer())
          .delete('/favorites/some-favorite-id')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        expect(favoritesService.remove).toHaveBeenCalledWith('some-favorite-id');
      });
    });
  });

  describe('with Fake Prisma', () => {
    let app: INestApplication;
    let moduleRef: TestingModule;
    let prisma: FakePrismaService;

    const userId = 123;
    const toolId = '00000000-0000-0000-0000-000000000001';

    beforeEach(async () => {
      process.env.NEXTAUTH_SECRET = secret;

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
      delete process.env.NEXTAUTH_SECRET;
    });

    it('should respond successfully when concurrent requests favorite the same tool', async () => {
      prisma.createBarrier('favorite.findUnique', 2);

      const token = createToken({ githubId: userId });

      const [first, second] = await Promise.all([
        request(app.getHttpServer())
          .post('/favorites/toggle')
          .set('Authorization', `Bearer ${token}`)
          .send({ toolId })
          .expect(200),
        request(app.getHttpServer())
          .post('/favorites/toggle')
          .set('Authorization', `Bearer ${token}`)
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

      const token = createToken({ githubId: userId });

      const [first, second] = await Promise.all([
        request(app.getHttpServer())
          .post('/favorites/toggle')
          .set('Authorization', `Bearer ${token}`)
          .send({ toolId })
          .expect(200),
        request(app.getHttpServer())
          .post('/favorites/toggle')
          .set('Authorization', `Bearer ${token}`)
          .send({ toolId })
          .expect(200),
      ]);

      expect(first.body).toEqual({ isFavorite: false });
      expect(second.body).toEqual({ isFavorite: false });
      expect(prisma.favoriteCount()).toBe(0);
    });
  });
});
