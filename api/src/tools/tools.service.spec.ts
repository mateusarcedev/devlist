import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
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
    it('should return tools for an existing category', async () => {
      const category = { id: 'cat-1' };
      const tools = [{ id: '1', name: 'Tool A', categoryId: 'cat-1' }];
      mockPrisma.category.findFirst.mockResolvedValue(category);
      mockPrisma.tool.findMany.mockResolvedValue(tools);

      const result = await service.findToolsByCategory('Frontend');
      expect(result).toEqual(tools);
      expect(mockPrisma.tool.findMany).toHaveBeenCalledWith({ where: { categoryId: 'cat-1' } });
    });

    it('should throw NotFoundException when category does not exist', async () => {
      mockPrisma.category.findFirst.mockResolvedValue(null);

      await expect(service.findToolsByCategory('NonExistent')).rejects.toThrow(
        new NotFoundException('Category not found'),
      );
      expect(mockPrisma.tool.findMany).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a tool by id', async () => {
      const tool = { id: '1', name: 'Tool A' };
      mockPrisma.tool.findUnique.mockResolvedValue(tool);

      expect(await service.findOne('1')).toEqual(tool);
      expect(mockPrisma.tool.findUnique).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('should throw NotFoundException when tool does not exist', async () => {
      mockPrisma.tool.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        new NotFoundException('Tool not found'),
      );
    });
  });

  describe('update', () => {
    it('should update and return the tool', async () => {
      const existing = { id: '1', name: 'Tool A' };
      const updated = { id: '1', name: 'Tool B' };
      mockPrisma.tool.findUnique.mockResolvedValue(existing);
      mockPrisma.tool.update.mockResolvedValue(updated);

      const result = await service.update('1', { name: 'Tool B' });
      expect(result).toEqual(updated);
      expect(mockPrisma.tool.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { name: 'Tool B' },
      });
    });

    it('should throw NotFoundException when tool does not exist', async () => {
      mockPrisma.tool.findUnique.mockResolvedValue(null);

      await expect(service.update('nonexistent', { name: 'Tool B' })).rejects.toThrow(
        new NotFoundException('Tool not found'),
      );
      expect(mockPrisma.tool.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete and return the tool', async () => {
      const tool = { id: '1', name: 'Tool A' };
      mockPrisma.tool.findUnique.mockResolvedValue(tool);
      mockPrisma.tool.delete.mockResolvedValue(tool);

      const result = await service.remove('1');
      expect(result).toEqual(tool);
      expect(mockPrisma.tool.findUnique).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(mockPrisma.tool.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('should throw NotFoundException when tool does not exist', async () => {
      mockPrisma.tool.findUnique.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        new NotFoundException('Tool not found'),
      );
      expect(mockPrisma.tool.delete).not.toHaveBeenCalled();
    });
  });
});
