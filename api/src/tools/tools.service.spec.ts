import { Test, TestingModule } from '@nestjs/testing';
import { ToolsService } from './tools.service';
import { PrismaService } from 'src/prisma/prisma.service';

const mockPrisma = {
  tool: {
    createMany: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  category: {
    findFirst: jest.fn(),
  },
};

describe('ToolsService', () => {
  let service: ToolsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ToolsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<ToolsService>(ToolsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all tools', async () => {
      const tools = [{ id: '1', name: 'Tool A' }];
      mockPrisma.tool.findMany.mockResolvedValue(tools);

      expect(await service.findAll()).toEqual(tools);
      expect(mockPrisma.tool.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('findToolsByCategory', () => {
    it('should return ok with tools for an existing category', async () => {
      const category = { id: 'cat-1' };
      const tools = [{ id: '1', name: 'Tool A', categoryId: 'cat-1' }];
      mockPrisma.category.findFirst.mockResolvedValue(category);
      mockPrisma.tool.findMany.mockResolvedValue(tools);

      const result = await service.findToolsByCategory('Frontend');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(tools);
        expect(mockPrisma.tool.findMany).toHaveBeenCalledWith({ where: { categoryId: 'cat-1' } });
      }
    });

    it('should return err NOT_FOUND when category does not exist', async () => {
      mockPrisma.category.findFirst.mockResolvedValue(null);

      const result = await service.findToolsByCategory('NonExistent');
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toEqual({ type: 'NOT_FOUND', message: 'Category not found' });
      }
      expect(mockPrisma.tool.findMany).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return ok with a tool by id', async () => {
      const tool = { id: '1', name: 'Tool A' };
      mockPrisma.tool.findUnique.mockResolvedValue(tool);

      const result = await service.findOne('1');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(tool);
        expect(mockPrisma.tool.findUnique).toHaveBeenCalledWith({ where: { id: '1' } });
      }
    });

    it('should return err NOT_FOUND when tool does not exist', async () => {
      mockPrisma.tool.findUnique.mockResolvedValue(null);

      const result = await service.findOne('nonexistent');
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toEqual({ type: 'NOT_FOUND', message: 'Tool not found' });
      }
    });
  });

  describe('update', () => {
    it('should return ok with the updated tool', async () => {
      const existing = { id: '1', name: 'Tool A' };
      const updated = { id: '1', name: 'Tool B' };
      mockPrisma.tool.findUnique.mockResolvedValue(existing);
      mockPrisma.tool.update.mockResolvedValue(updated);

      const result = await service.update('1', { name: 'Tool B' });
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(updated);
        expect(mockPrisma.tool.update).toHaveBeenCalledWith({
          where: { id: '1' },
          data: { name: 'Tool B' },
        });
      }
    });

    it('should return err NOT_FOUND when tool does not exist', async () => {
      mockPrisma.tool.findUnique.mockResolvedValue(null);

      const result = await service.update('nonexistent', { name: 'Tool B' });
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toEqual({ type: 'NOT_FOUND', message: 'Tool not found' });
      }
      expect(mockPrisma.tool.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should return ok with the deleted tool', async () => {
      const tool = { id: '1', name: 'Tool A' };
      mockPrisma.tool.findUnique.mockResolvedValue(tool);
      mockPrisma.tool.delete.mockResolvedValue(tool);

      const result = await service.remove('1');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(tool);
        expect(mockPrisma.tool.findUnique).toHaveBeenCalledWith({ where: { id: '1' } });
        expect(mockPrisma.tool.delete).toHaveBeenCalledWith({ where: { id: '1' } });
      }
    });

    it('should return err NOT_FOUND when tool does not exist', async () => {
      mockPrisma.tool.findUnique.mockResolvedValue(null);

      const result = await service.remove('nonexistent');
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toEqual({ type: 'NOT_FOUND', message: 'Tool not found' });
      }
      expect(mockPrisma.tool.delete).not.toHaveBeenCalled();
    });
  });
});
