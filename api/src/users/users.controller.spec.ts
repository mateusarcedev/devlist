import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { sign } from 'jsonwebtoken';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let app: INestApplication;
  let controller: UsersController;
  const usersService = {
    createOrUpdateUser: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };
  const secret = 'test-secret';

  beforeAll(async () => {
    process.env.NEXTAUTH_SECRET = secret;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: usersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
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

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('PATCH /users/:githubId', () => {
    it('should reject update without authorization header', async () => {
      await request(app.getHttpServer())
        .patch('/users/456')
        .send({ name: 'New Name' })
        .expect(401);

      expect(usersService.update).not.toHaveBeenCalled();
    });

    it('should reject update when token belongs to a different user', async () => {
      const token = createToken({ githubId: 456 });

      await request(app.getHttpServer())
        .patch('/users/789')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'New Name' })
        .expect(403);

      expect(usersService.update).not.toHaveBeenCalled();
    });

    it('should allow update when token matches the target user', async () => {
      usersService.update.mockResolvedValue({ githubId: 456, name: 'New Name' });

      const token = createToken({ githubId: 456 });

      await request(app.getHttpServer())
        .patch('/users/456')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'New Name' })
        .expect(200)
        .expect({ githubId: 456, name: 'New Name' });

      expect(usersService.update).toHaveBeenCalled();
    });
  });

  describe('DELETE /users/:githubId', () => {
    it('should reject deletion without authorization header', async () => {
      await request(app.getHttpServer())
        .delete('/users/456')
        .expect(401);

      expect(usersService.remove).not.toHaveBeenCalled();
    });

    it('should reject deletion when token belongs to a different user', async () => {
      const token = createToken({ githubId: 456 });

      await request(app.getHttpServer())
        .delete('/users/789')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(usersService.remove).not.toHaveBeenCalled();
    });

    it('should allow deletion when token matches the target user', async () => {
      usersService.remove.mockResolvedValue({ githubId: 456 });

      const token = createToken({ githubId: 456 });

      await request(app.getHttpServer())
        .delete('/users/456')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(usersService.remove).toHaveBeenCalled();
    });
  });
});
