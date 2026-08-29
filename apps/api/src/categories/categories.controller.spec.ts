import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

const mockCategoriesService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('CategoriesController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [{ provide: CategoriesService, useValue: mockCategoriesService }],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /categories', () => {
    it('should return 200 with all categories', async () => {
      const categories = [{ id: '1', name: 'Frontend' }];
      mockCategoriesService.findAll.mockResolvedValue(categories);

      const res = await request(app.getHttpServer()).get('/categories');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(categories);
    });
  });

  describe('GET /categories/:id', () => {
    it('should return 200 with the category', async () => {
      const category = { id: '1', name: 'Frontend' };
      mockCategoriesService.findOne.mockResolvedValue(category);

      const res = await request(app.getHttpServer()).get('/categories/1');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(category);
    });
  });

  describe('POST /categories', () => {
    it('should return 201 with created category', async () => {
      const dto = { name: 'DevOps' };
      const created = { id: '2', name: 'DevOps' };
      mockCategoriesService.create.mockResolvedValue(created);

      const res = await request(app.getHttpServer()).post('/categories').send(dto);
      expect(res.status).toBe(201);
      expect(res.body).toEqual(created);
    });
  });

  describe('PATCH /categories/:id', () => {
    it('should return 200 with updated category', async () => {
      const updated = { id: '1', name: 'Frontend Updated' };
      mockCategoriesService.update.mockResolvedValue(updated);

      const res = await request(app.getHttpServer()).patch('/categories/1').send({ name: 'Frontend Updated' });
      expect(res.status).toBe(200);
      expect(res.body).toEqual(updated);
    });
  });

  describe('DELETE /categories/:id', () => {
    it('should return 200 with deleted category', async () => {
      const deleted = { id: '1', name: 'Frontend' };
      mockCategoriesService.remove.mockResolvedValue(deleted);

      const res = await request(app.getHttpServer()).delete('/categories/1');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(deleted);
    });
  });
});
