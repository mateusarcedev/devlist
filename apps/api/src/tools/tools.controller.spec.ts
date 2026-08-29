import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { okAsync, errAsync } from 'neverthrow';
import { ToolsController } from './tools.controller';
import { ToolsService } from './tools.service';

const NOT_FOUND = { type: 'NOT_FOUND' as const, message: 'Not found' };

const mockToolsService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findToolsByCategory: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('ToolsController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ToolsController],
      providers: [{ provide: ToolsService, useValue: mockToolsService }],
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

  describe('GET /tools', () => {
    it('should return 200 with all tools', async () => {
      const tools = [{ id: '1', name: 'Tool A' }];
      mockToolsService.findAll.mockResolvedValue(tools);

      const res = await request(app.getHttpServer()).get('/tools');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(tools);
    });
  });

  describe('GET /tools/category/:nameCategory', () => {
    it('should return 200 with tools for the category', async () => {
      const tools = [{ id: '1', name: 'Tool A' }];
      mockToolsService.findToolsByCategory.mockReturnValue(okAsync(tools));

      const res = await request(app.getHttpServer()).get('/tools/category/Frontend');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(tools);
      expect(mockToolsService.findToolsByCategory).toHaveBeenCalledWith('Frontend');
    });

    it('should return 404 when category does not exist', async () => {
      mockToolsService.findToolsByCategory.mockReturnValue(errAsync(NOT_FOUND));

      const res = await request(app.getHttpServer()).get('/tools/category/NonExistent');
      expect(res.status).toBe(404);
    });
  });

  describe('GET /tools/:id', () => {
    it('should return 200 with the tool', async () => {
      const tool = { id: '1', name: 'Tool A' };
      mockToolsService.findOne.mockReturnValue(okAsync(tool));

      const res = await request(app.getHttpServer()).get('/tools/1');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(tool);
    });

    it('should return 404 when tool does not exist', async () => {
      mockToolsService.findOne.mockReturnValue(errAsync(NOT_FOUND));

      const res = await request(app.getHttpServer()).get('/tools/nonexistent');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /tools', () => {
    it('should wrap a single dto in an array before calling the service', async () => {
      const dto = { name: 'Tool A', link: 'https://tool.com', description: 'desc', categoryId: 'cat-1' };
      const created = { count: 1 };
      mockToolsService.create.mockResolvedValue(created);

      const res = await request(app.getHttpServer()).post('/tools').send(dto);
      expect(res.status).toBe(201);
      expect(res.body).toEqual(created);
      expect(mockToolsService.create).toHaveBeenCalledWith([dto]);
    });

    it('should accept an array of dtos and pass them directly to the service', async () => {
      const dtos = [
        { name: 'Tool A', link: 'https://tool-a.com', description: 'desc a', categoryId: 'cat-1' },
        { name: 'Tool B', link: 'https://tool-b.com', description: 'desc b', categoryId: 'cat-1' },
      ];
      const created = { count: 2 };
      mockToolsService.create.mockResolvedValue(created);

      const res = await request(app.getHttpServer()).post('/tools').send(dtos);
      expect(res.status).toBe(201);
      expect(res.body).toEqual(created);
      expect(mockToolsService.create).toHaveBeenCalledWith(dtos);
    });
  });

  describe('PATCH /tools/:id', () => {
    it('should return 200 with updated tool', async () => {
      const updated = { id: '1', name: 'Tool B' };
      mockToolsService.update.mockReturnValue(okAsync(updated));

      const res = await request(app.getHttpServer()).patch('/tools/1').send({ name: 'Tool B' });
      expect(res.status).toBe(200);
      expect(res.body).toEqual(updated);
    });

    it('should return 404 when tool does not exist', async () => {
      mockToolsService.update.mockReturnValue(errAsync(NOT_FOUND));

      const res = await request(app.getHttpServer()).patch('/tools/nonexistent').send({ name: 'Tool B' });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /tools/:id', () => {
    it('should return 200 with deleted tool', async () => {
      const tool = { id: '1', name: 'Tool A' };
      mockToolsService.remove.mockReturnValue(okAsync(tool));

      const res = await request(app.getHttpServer()).delete('/tools/1');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(tool);
    });

    it('should return 404 when tool does not exist', async () => {
      mockToolsService.remove.mockReturnValue(errAsync(NOT_FOUND));

      const res = await request(app.getHttpServer()).delete('/tools/nonexistent');
      expect(res.status).toBe(404);
    });
  });
});
