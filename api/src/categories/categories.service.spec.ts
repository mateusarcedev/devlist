import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { PrismaService } from 'src/prisma/prisma.service';

const mockPrisma = {
  category: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('CategoriesService', () => {
  let service: CategoriesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<CategoriesService>(CategoriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should call prisma.category.create with the dto', async () => {
      const dto = { name: 'Frontend' };
      const created = { id: '1', name: 'Frontend' };
      mockPrisma.category.create.mockResolvedValue(created);

      const result = await service.create(dto);
      expect(result).toEqual(created);
      expect(mockPrisma.category.create).toHaveBeenCalledWith({ data: dto });
    });
  });

  describe('findAll', () => {
    it('should return categories ordered by name ascending', async () => {
      const categories = [{ id: '1', name: 'Backend' }, { id: '2', name: 'Frontend' }];
      mockPrisma.category.findMany.mockResolvedValue(categories);

      const result = await service.findAll();
      expect(result).toEqual(categories);
      expect(mockPrisma.category.findMany).toHaveBeenCalledWith({ orderBy: { name: 'asc' } });
    });
  });

  describe('findOne', () => {
    it('should return a category by id', async () => {
      const category = { id: '1', name: 'Frontend' };
      mockPrisma.category.findUnique.mockResolvedValue(category);

      const result = await service.findOne('1');
      expect(result).toEqual(category);
      expect(mockPrisma.category.findUnique).toHaveBeenCalledWith({ where: { id: '1' } });
    });
  });

  describe('update', () => {
    it('should call prisma.category.update and return result', async () => {
      const updated = { id: '1', name: 'Updated' };
      mockPrisma.category.update.mockResolvedValue(updated);

      const result = await service.update('1', { name: 'Updated' });
      expect(result).toEqual(updated);
      expect(mockPrisma.category.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { name: 'Updated' },
      });
    });
  });

  describe('remove', () => {
    it('should call prisma.category.delete and return result', async () => {
      const deleted = { id: '1', name: 'Frontend' };
      mockPrisma.category.delete.mockResolvedValue(deleted);

      const result = await service.remove('1');
      expect(result).toEqual(deleted);
      expect(mockPrisma.category.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    });
  });
});
