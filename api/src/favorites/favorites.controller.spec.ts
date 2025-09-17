import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { sign } from 'jsonwebtoken';
import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';

jest.mock('./favorites.service', () => {
  class FavoritesServiceMock {}

  return { FavoritesService: FavoritesServiceMock };
});

jest.mock('src/common/guards/authenticated-user.guard', () =>
  jest.requireActual('../common/guards/authenticated-user.guard'),
);

jest.mock('src/common/decorators/current-user.decorator', () =>
  jest.requireActual('../common/decorators/current-user.decorator'),
);

jest.mock('src/common/interfaces/authenticated-user.interface', () =>
  jest.requireActual('../common/interfaces/authenticated-user.interface'),
);

describe('FavoritesController', () => {
  let app: INestApplication;
  let controller: FavoritesController;
  const favoritesService = {
    create: jest.fn(),
    checkFavorite: jest.fn(),
    getFavoritesByUserId: jest.fn(),
    toggleFavorite: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };
  const secret = 'test-secret';

  beforeAll(async () => {
    process.env.NEXTAUTH_SECRET = secret;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FavoritesController],
      providers: [
        {
          provide: FavoritesService,
          useValue: favoritesService,
        },
      ],
    }).compile();

    controller = module.get<FavoritesController>(FavoritesController);
    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    delete process.env.NEXTAUTH_SECRET;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createToken = (payload: Record<string, unknown> = {}) =>
    sign({ githubId: 123, ...payload }, secret);

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should reject requests without an authorization header', async () => {
    await request(app.getHttpServer())
      .post('/favorites/toggle')
      .send({ toolId: '11111111-1111-1111-1111-111111111111' })
      .expect(401);

    expect(favoritesService.toggleFavorite).not.toHaveBeenCalled();
  });

  it('should reject requests with an invalid token', async () => {
    await request(app.getHttpServer())
      .post('/favorites/toggle')
      .set('Authorization', 'Bearer invalid-token')
      .send({ toolId: '11111111-1111-1111-1111-111111111111' })
      .expect(401);

    expect(favoritesService.toggleFavorite).not.toHaveBeenCalled();
  });

  it('should forward valid requests to the service', async () => {
    favoritesService.toggleFavorite.mockResolvedValue({ success: true });

    const token = createToken();

    await request(app.getHttpServer())
      .post('/favorites/toggle')
      .set('Authorization', `Bearer ${token}`)
      .send({ toolId: '11111111-1111-1111-1111-111111111111' })
      .expect(201)
      .expect({ success: true });

    expect(favoritesService.toggleFavorite).toHaveBeenCalledWith(
      123,
      '11111111-1111-1111-1111-111111111111',
    );
  });
});
