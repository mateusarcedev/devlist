import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { sign } from 'jsonwebtoken';
import { okAsync, errAsync } from 'neverthrow';
import { SuggestionsController } from './suggestions.controller';
import { SuggestionsService } from './suggestions.service';

jest.mock('./suggestions.service', () => {
  class SuggestionsServiceMock {}
  return { SuggestionsService: SuggestionsServiceMock };
});

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
    app.useGlobalPipes(new ValidationPipe());
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

  it('should reject suggestion creation with an invalid URL in the link field', async () => {
    const token = createToken();

    await request(app.getHttpServer())
      .post('/suggestions')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...suggestionPayload, link: 'not-a-valid-url' })
      .expect(400);

    expect(suggestionsService.create).not.toHaveBeenCalled();
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
    suggestionsService.create.mockReturnValue(okAsync({ id: 'suggestion-id' }));

    const token = createToken();

    await request(app.getHttpServer())
      .post('/suggestions')
      .set('Authorization', `Bearer ${token}`)
      .send(suggestionPayload)
      .expect(201)
      .expect({ id: 'suggestion-id' });

    expect(suggestionsService.create).toHaveBeenCalledWith(456, suggestionPayload);
  });

  it('should return 404 when create fails (user or category not found)', async () => {
    suggestionsService.create.mockReturnValue(
      errAsync({ type: 'NOT_FOUND' as const, message: 'Category not found' }),
    );

    const token = createToken();

    await request(app.getHttpServer())
      .post('/suggestions')
      .set('Authorization', `Bearer ${token}`)
      .send(suggestionPayload)
      .expect(404);
  });

  it('should return all suggestions', async () => {
    const suggestions = [{ id: 'sug-1' }, { id: 'sug-2' }];
    suggestionsService.findAll.mockResolvedValue(suggestions);

    const res = await request(app.getHttpServer()).get('/suggestions');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(suggestions);
  });

  describe('GET /suggestions/:id', () => {
    it('should return 200 with the suggestion', async () => {
      const suggestion = { id: 'suggestion-1', name: 'Tool X' };
      suggestionsService.findOne.mockReturnValue(okAsync(suggestion));

      const res = await request(app.getHttpServer()).get('/suggestions/suggestion-1');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(suggestion);
    });

    it('should return 404 when suggestion does not exist', async () => {
      suggestionsService.findOne.mockReturnValue(
        errAsync({ type: 'NOT_FOUND' as const, message: 'Suggestion not found' }),
      );

      const res = await request(app.getHttpServer()).get('/suggestions/nonexistent');
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /suggestions/:id', () => {
    it('should return 404 when suggestion does not exist', async () => {
      suggestionsService.findOne.mockReturnValue(
        errAsync({ type: 'NOT_FOUND' as const, message: 'Suggestion not found' }),
      );

      const token = createToken();

      await request(app.getHttpServer())
        .patch('/suggestions/nonexistent')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Tool' })
        .expect(404);
    });

    it('should reject update without credentials', async () => {
      await request(app.getHttpServer())
        .patch('/suggestions/suggestion-1')
        .send({ name: 'Updated Tool' })
        .expect(401);

      expect(suggestionsService.update).not.toHaveBeenCalled();
    });

    it('should reject update from a user who does not own the suggestion', async () => {
      suggestionsService.findOne.mockReturnValue(okAsync({ id: 'suggestion-1', userId: 999 }));

      const token = createToken();

      await request(app.getHttpServer())
        .patch('/suggestions/suggestion-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Tool' })
        .expect(403);

      expect(suggestionsService.update).not.toHaveBeenCalled();
    });

    it('should allow update from the suggestion owner', async () => {
      suggestionsService.findOne.mockReturnValue(okAsync({ id: 'suggestion-1', userId: 456 }));
      suggestionsService.update.mockResolvedValue({ id: 'suggestion-1', name: 'Updated Tool' });

      const token = createToken();

      await request(app.getHttpServer())
        .patch('/suggestions/suggestion-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Tool' })
        .expect(200)
        .expect({ id: 'suggestion-1', name: 'Updated Tool' });

      expect(suggestionsService.update).toHaveBeenCalledWith('suggestion-1', { name: 'Updated Tool' });
    });
  });

  describe('DELETE /suggestions/:id', () => {
    it('should return 404 when suggestion does not exist', async () => {
      suggestionsService.findOne.mockReturnValue(
        errAsync({ type: 'NOT_FOUND' as const, message: 'Suggestion not found' }),
      );

      const token = createToken();

      await request(app.getHttpServer())
        .delete('/suggestions/nonexistent')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('should reject deletion without credentials', async () => {
      await request(app.getHttpServer())
        .delete('/suggestions/suggestion-1')
        .expect(401);

      expect(suggestionsService.remove).not.toHaveBeenCalled();
    });

    it('should reject deletion from a user who does not own the suggestion', async () => {
      suggestionsService.findOne.mockReturnValue(okAsync({ id: 'suggestion-1', userId: 999 }));

      const token = createToken();

      await request(app.getHttpServer())
        .delete('/suggestions/suggestion-1')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(suggestionsService.remove).not.toHaveBeenCalled();
    });

    it('should allow deletion from the suggestion owner', async () => {
      suggestionsService.findOne.mockReturnValue(okAsync({ id: 'suggestion-1', userId: 456 }));
      suggestionsService.remove.mockResolvedValue({ id: 'suggestion-1' });

      const token = createToken();

      await request(app.getHttpServer())
        .delete('/suggestions/suggestion-1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(suggestionsService.remove).toHaveBeenCalledWith('suggestion-1');
    });
  });
});
