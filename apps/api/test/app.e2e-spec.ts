import 'dotenv/config';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { sign } from 'jsonwebtoken';
import request from 'supertest';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { PrismaService } from '../src/prisma/prisma.service';

const USER_ID = 910001;
const OTHER_USER_ID = 910002;
const ADMIN_ID = 910003;
const CATEGORY_ID = '11111111-1111-4111-8111-111111111111';
const TOOL_ID = '22222222-2222-4222-8222-222222222222';
const ADMIN_CATEGORY_NAME = 'E2E Admin Category';
const ADMIN_CATEGORY_UPDATED_NAME = 'E2E Admin Category Updated';
const ADMIN_TOOL_LINK = 'https://example.com/e2e-admin-tool';
const FORBIDDEN_TOOL_LINK = 'https://example.com/forbidden-tool';
const UNAUTHORIZED_CATEGORY_NAME = 'Unauthorized Category';
const FORBIDDEN_CATEGORY_NAME = 'Forbidden Category';

describe('Devlist API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userToken: string;
  let otherUserToken: string;
  let adminToken: string;

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
        {
          githubId: ADMIN_ID,
          name: 'E2E Admin',
          email: 'e2e-admin@example.com',
          avatar: 'https://example.com/e2e-admin.png',
          role: 'ADMIN',
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
    adminToken = sign(
      { sub: ADMIN_ID, role: 'ADMIN' },
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
      where: { userId: { in: [USER_ID, OTHER_USER_ID, ADMIN_ID] } },
    });
    await prisma?.favorite.deleteMany({
      where: { userId: { in: [USER_ID, OTHER_USER_ID, ADMIN_ID] } },
    });
    await prisma?.suggestion.deleteMany({
      where: { userId: { in: [USER_ID, OTHER_USER_ID, ADMIN_ID] } },
    });
    await prisma?.tool.deleteMany({
      where: {
        OR: [
          { id: TOOL_ID },
          { link: ADMIN_TOOL_LINK },
          { link: FORBIDDEN_TOOL_LINK },
        ],
      },
    });
    await prisma?.category.deleteMany({
      where: {
        OR: [
          { id: CATEGORY_ID },
          { name: ADMIN_CATEGORY_NAME },
          { name: ADMIN_CATEGORY_UPDATED_NAME },
          { name: UNAUTHORIZED_CATEGORY_NAME },
          { name: FORBIDDEN_CATEGORY_NAME },
        ],
      },
    });
    await prisma?.user.deleteMany({
      where: { githubId: { in: [USER_ID, OTHER_USER_ID, ADMIN_ID] } },
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
  it('keeps tool and category reads public', async () => {
    await request(app.getHttpServer()).get('/tools').expect(200);
    await request(app.getHttpServer()).get('/categories').expect(200);
  });

  it('blocks unauthenticated and non-admin users from administrative mutations', async () => {
    await request(app.getHttpServer())
      .post('/categories')
      .send({ name: UNAUTHORIZED_CATEGORY_NAME })
      .expect(401);

    await request(app.getHttpServer())
      .post('/categories')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: FORBIDDEN_CATEGORY_NAME })
      .expect(403);

    await request(app.getHttpServer())
      .patch(`/categories/${CATEGORY_ID}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Forbidden Update' })
      .expect(403);

    await request(app.getHttpServer())
      .delete(`/categories/${CATEGORY_ID}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .post('/tools')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Forbidden Tool',
        link: FORBIDDEN_TOOL_LINK,
        description: 'Must not be created by a regular user',
        categoryId: CATEGORY_ID,
      })
      .expect(403);

    await request(app.getHttpServer())
      .patch(`/tools/${TOOL_ID}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Forbidden Tool Update' })
      .expect(403);

    await request(app.getHttpServer())
      .delete(`/tools/${TOOL_ID}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);
  });

  it('allows an ADMIN to manage categories and tools', async () => {
    const categoryResponse = await request(app.getHttpServer())
      .post('/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: ADMIN_CATEGORY_NAME })
      .expect(201);

    expect(categoryResponse.body.name).toBe(ADMIN_CATEGORY_NAME);
    const adminCategoryId = categoryResponse.body.id as string;

    await request(app.getHttpServer())
      .post('/tools')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'E2E Admin Tool',
        link: ADMIN_TOOL_LINK,
        description: 'Tool created by an admin E2E flow',
        categoryId: adminCategoryId,
      })
      .expect(201)
      .expect({ count: 1 });

    const adminTool = await prisma.tool.findUnique({
      where: { link: ADMIN_TOOL_LINK },
    });
    expect(adminTool).not.toBeNull();

    await request(app.getHttpServer())
      .patch(`/tools/${adminTool!.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'E2E Admin Tool Updated' })
      .expect(200)
      .expect(({ body }) => {
        expect(body.name).toBe('E2E Admin Tool Updated');
      });

    await request(app.getHttpServer())
      .patch(`/categories/${adminCategoryId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: ADMIN_CATEGORY_UPDATED_NAME })
      .expect(200)
      .expect(({ body }) => {
        expect(body.name).toBe(ADMIN_CATEGORY_UPDATED_NAME);
      });

    await request(app.getHttpServer())
      .delete(`/tools/${adminTool!.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .delete(`/categories/${adminCategoryId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });

});
