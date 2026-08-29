import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from 'src/prisma/prisma.service';

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createOrUpdateUser', () => {
    const dto = { githubId: 42, name: 'Alice', email: 'alice@example.com', avatar: 'https://avatar.url' };

    it('should create a new user when githubId does not exist', async () => {
      const created = { ...dto, role: 'USER' };
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(created);

      const result = await service.createOrUpdateUser(dto);
      expect(result).toEqual(created);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: { githubId: dto.githubId, name: dto.name, email: dto.email, avatar: dto.avatar },
      });
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('should update an existing user when githubId already exists', async () => {
      const existing = { ...dto, role: 'USER' };
      const updated = { ...dto, name: 'Alice Updated', role: 'USER' };
      mockPrisma.user.findUnique.mockResolvedValue(existing);
      mockPrisma.user.update.mockResolvedValue(updated);

      const updateDto = { ...dto, name: 'Alice Updated' };
      const result = await service.createOrUpdateUser(updateDto);
      expect(result).toEqual(updated);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { githubId: dto.githubId },
        data: { name: 'Alice Updated', email: dto.email, avatar: dto.avatar },
      });
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a user by githubId', async () => {
      const user = { githubId: 42, name: 'Alice' };
      mockPrisma.user.findUnique.mockResolvedValue(user);

      const result = await service.findOne(42);
      expect(result).toEqual(user);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { githubId: 42 } });
    });

    it('should return null when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await service.findOne(999);
      expect(result).toBeNull();
    });
  });
});
