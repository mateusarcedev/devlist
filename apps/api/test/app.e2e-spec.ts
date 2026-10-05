import 'dotenv/config';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { sign } from 'jsonwebtoken';
import request from 'supertest';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { PrismaService } from '../src/prisma/prisma.service';

const USER_ID = 910001;
const OTHER_USER_ID = 910002;
const CATEGORY_ID = '11111111-1111-4111-8111-111111111111';
const TOOL_ID = '22222222-2222-4222-8222-222222222222';

describe('Devlist API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userToken: string;
  let otherUserToken: string;

  beforeAll(async () => {
    process.env.NODE_ENV ??= 'test';
    process.env.JWT_SECRET ??= 'e2e-jwt-secret';
    process.env.GITHUB_ID ??= 'e2e-github-id';
    process.env.GITHUB_SECRET ??= 'e2e-github-secret';
    process.env.API_URL ??= 'http://localhost:3001';
    process.env.FRONTEND_URL ??= 'http://localhost:3000';

    const { AppModule } = await import('../src/app/app.module');

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    app.useGlobalFilters(new GlobalExceptionFilter());

    await app.init();

    prisma = app.get(PrismaService);

    await cleanupFixtures();

    await prisma.user.createMany({
      data: [
        {
          githubId: USER_ID,
          name: 'E2E User',
          email: 'e2e-user@example.com',
          avatar: 'https://example.com/e2e-user.png',
          role: 'USER',
        },
        {
          githubId: OTHER_USER_ID,
          name: 'E2E Other User',
          email: 'e2e-other@example.com',
          avatar: 'https://example.com/e2e-other.png',
          role: 'USER',
        },
      ],
    });

    await prisma.category.create({
      data: {
        id: CATEGORY_ID,
        name: 'E2E Category',
      },
    });

    await prisma.tool.create({
      data: {
        id: TOOL_ID,
        name: 'E2E Tool',
        link: 'https://example.com/e2e-tool',
        description: 'Tool created only for API E2E tests',
        categoryId: CATEGORY_ID,
      },
    });

    userToken = sign({ sub: USER_ID, role: 'USER' }, process.env.JWT_SECRET);
    otherUserToken = sign(
      { sub: OTHER_USER_ID, role: 'USER' },
      process.env.JWT_SECRET,
    );
  });

  afterAll(async () => {
    if (prisma) {
      await cleanupFixtures();
    }
    if (app) {
      await app.close();
    }
  });

  async function cleanupFixtures() {
    await prisma?.refreshToken.deleteMany({
      where: { userId: { in: [USER_ID, OTHER_USER_ID] } },
    });
    await prisma?.favorite.deleteMany({
      where: { userId: { in: [USER_ID, OTHER_USER_ID] } },
    });
    await prisma?.suggestion.deleteMany({
      where: { userId: { in: [USER_ID, OTHER_USER_ID] } },
    });
    await prisma?.tool.deleteMany({ where: { id: TOOL_ID } });
    await prisma?.category.deleteMany({ where: { id: CATEGORY_ID } });
    await prisma?.user.deleteMany({
      where: { githubId: { in: [USER_ID, OTHER_USER_ID] } },
    });
  }

  it('reports liveness and database readiness', async () => {
    await request(app.getHttpServer())
      .get('/health/live')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual({
          status: 'ok',
          service: 'api',
          checks: { database: 'not-required' },
        });
      });

    await request(app.getHttpServer())
      .get('/health/ready')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual({
          status: 'ok',
          service: 'api',
          checks: { database: 'up' },
        });
      });
  });

  it('rejects unauthenticated access to the current-user endpoint', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(401);
  });

  it('accepts a valid bearer token and returns the current user', async () => {
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.githubId).toBe(USER_ID);
        expect(body.email).toBe('e2e-user@example.com');
      });
  });

  it('toggles and reads favorites for the authenticated user', async () => {
    await request(app.getHttpServer())
      .post('/favorites/toggle')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ toolId: TOOL_ID })
      .expect(200)
      .expect({ isFavorite: true });

    await request(app.getHttpServer())
      .get(`/favorites/check?toolId=${TOOL_ID}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200)
      .expect({ isFavorite: true });

    await request(app.getHttpServer())
      .get(`/favorites/user/${USER_ID}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toHaveLength(1);
        expect(body[0].tool.id).toBe(TOOL_ID);
      });
  });

  it('forbids reading another user favorites', async () => {
    await request(app.getHttpServer())
      .get(`/favorites/user/${OTHER_USER_ID}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);
  });

  it('enforces suggestion ownership across authenticated users', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/suggestions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'E2E Suggestion',
        link: 'https://example.com/e2e-suggestion',
        description: 'Suggestion created by the E2E suite',
        categoryId: CATEGORY_ID,
      })
      .expect(201);

    expect(createResponse.body.userId).toBe(USER_ID);
    expect(createResponse.body.status).toBe('PENDING');

    await request(app.getHttpServer())
      .patch(`/suggestions/${createResponse.body.id}`)
      .set('Authorization', `Bearer ${otherUserToken}`)
      .send({ description: 'Unauthorized change' })
      .expect(403);
  });
});
