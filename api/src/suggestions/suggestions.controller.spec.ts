import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { sign } from 'jsonwebtoken';
import { SuggestionsController } from './suggestions.controller';
import { SuggestionsService } from './suggestions.service';

jest.mock('./suggestions.service', () => {
  class SuggestionsServiceMock {}

  return { SuggestionsService: SuggestionsServiceMock };
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

describe('SuggestionsController', () => {
  let app: INestApplication;
  let controller: SuggestionsController;
  const suggestionsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };
  const secret = 'test-secret';

  beforeAll(async () => {
    process.env.NEXTAUTH_SECRET = secret;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SuggestionsController],
      providers: [
        {
          provide: SuggestionsService,
          useValue: suggestionsService,
        },
      ],
    }).compile();

    controller = module.get<SuggestionsController>(SuggestionsController);
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
    sign({ githubId: 456, ...payload }, secret);

  const suggestionPayload = {
    name: 'New Tool',
    link: 'https://example.com',
    description: 'A helpful tool',
    categoryId: 'category-1',
  };

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should reject suggestion creation without credentials', async () => {
    await request(app.getHttpServer())
      .post('/suggestions')
      .send(suggestionPayload)
      .expect(401);

    expect(suggestionsService.create).not.toHaveBeenCalled();
  });

  it('should reject suggestion creation with an invalid token', async () => {
    await request(app.getHttpServer())
      .post('/suggestions')
      .set('Authorization', 'Bearer invalid-token')
      .send(suggestionPayload)
      .expect(401);

    expect(suggestionsService.create).not.toHaveBeenCalled();
  });

  it('should accept suggestion creation with a valid token', async () => {
    suggestionsService.create.mockResolvedValue({ id: 'suggestion-id' });

    const token = createToken();

    await request(app.getHttpServer())
      .post('/suggestions')
      .set('Authorization', `Bearer ${token}`)
      .send(suggestionPayload)
      .expect(201)
      .expect({ id: 'suggestion-id' });

    expect(suggestionsService.create).toHaveBeenCalledWith(456, suggestionPayload);
  });
});
