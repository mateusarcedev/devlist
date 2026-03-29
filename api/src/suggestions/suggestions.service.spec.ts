import { Test, TestingModule } from '@nestjs/testing';
import { SuggestionsService } from './suggestions.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { SuggestionStatus } from '@prisma/client';

const mockPrisma = {
  user: { findUnique: jest.fn() },
  category: { findUnique: jest.fn() },
  suggestion: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('SuggestionsService', () => {
  let service: SuggestionsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuggestionsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<SuggestionsService>(SuggestionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const userId = 42;
    const dto = {
      name: 'Tool X',
      link: 'https://toolx.com',
      description: 'A great tool',
      categoryId: 'cat-1',
    };

    it('should return err NOT_FOUND when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.category.findUnique.mockResolvedValue({ id: 'cat-1' });

      const result = await service.create(userId, dto);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toEqual({ type: 'NOT_FOUND', message: 'User not found' });
      }
      expect(mockPrisma.suggestion.create).not.toHaveBeenCalled();
    });

    it('should return err NOT_FOUND when category does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ githubId: userId });
      mockPrisma.category.findUnique.mockResolvedValue(null);

      const result = await service.create(userId, dto);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toEqual({ type: 'NOT_FOUND', message: 'Category not found' });
      }
      expect(mockPrisma.suggestion.create).not.toHaveBeenCalled();
    });

    it('should return ok with PENDING suggestion when user and category exist', async () => {
      const created = { id: 'sug-1', ...dto, userId, status: SuggestionStatus.PENDING };
      mockPrisma.user.findUnique.mockResolvedValue({ githubId: userId });
      mockPrisma.category.findUnique.mockResolvedValue({ id: 'cat-1' });
      mockPrisma.suggestion.create.mockResolvedValue(created);

      const result = await service.create(userId, dto);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(created);
        expect(mockPrisma.suggestion.create).toHaveBeenCalledWith({
          data: {
            name: dto.name,
            link: dto.link,
            description: dto.description,
            categoryId: dto.categoryId,
            userId,
            status: SuggestionStatus.PENDING,
          },
          include: { user: true, category: true },
        });
      }
    });

    it('should return err when suggestion creation fails', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ githubId: userId });
      mockPrisma.category.findUnique.mockResolvedValue({ id: 'cat-1' });
      mockPrisma.suggestion.create.mockRejectedValue(new Error('DB error'));

      const result = await service.create(userId, dto);
      expect(result.isErr()).toBe(true);
    });
  });

  describe('findOne', () => {
    it('should return ok with a suggestion with relations', async () => {
      const suggestion = { id: 'sug-1', name: 'Tool X', user: {}, category: {}, tool: null };
      mockPrisma.suggestion.findUnique.mockResolvedValue(suggestion);

      const result = await service.findOne('sug-1');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(suggestion);
      }
    });

    it('should return err NOT_FOUND when suggestion does not exist', async () => {
      mockPrisma.suggestion.findUnique.mockResolvedValue(null);

      const result = await service.findOne('nonexistent');
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toEqual({ type: 'NOT_FOUND', message: 'Suggestion not found' });
      }
    });

    it('should return err when Prisma rejects', async () => {
      mockPrisma.suggestion.findUnique.mockRejectedValue(new Error('DB error'));

      const result = await service.findOne('sug-1');
      expect(result.isErr()).toBe(true);
    });
  });

  describe('update', () => {
    it('should update and return the suggestion', async () => {
      const updated = { id: 'sug-1', status: SuggestionStatus.APPROVED };
      mockPrisma.suggestion.update.mockResolvedValue(updated);

      const result = await service.update('sug-1', { status: SuggestionStatus.APPROVED });
      expect(result).toEqual(updated);
      expect(mockPrisma.suggestion.update).toHaveBeenCalledWith({
        where: { id: 'sug-1' },
        data: { status: SuggestionStatus.APPROVED },
      });
    });
  });

  describe('remove', () => {
    it('should delete and return the suggestion', async () => {
      const deleted = { id: 'sug-1', name: 'Tool X' };
      mockPrisma.suggestion.delete.mockResolvedValue(deleted);

      const result = await service.remove('sug-1');
      expect(result).toEqual(deleted);
      expect(mockPrisma.suggestion.delete).toHaveBeenCalledWith({ where: { id: 'sug-1' } });
    });
  });
});
