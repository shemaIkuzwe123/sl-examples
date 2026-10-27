import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';

describe('Tasks (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // Keep in sync with the global pipe in src/main.ts.
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /health', () => {
    return request(app.getHttpServer()).get('/health').expect(200).expect({ status: 'ok' });
  });

  it('GET /tasks returns seeded tasks', async () => {
    const response = await request(app.getHttpServer()).get('/tasks').expect(200);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it('POST /tasks creates a task and GET /tasks/:id finds it', async () => {
    const created = await request(app.getHttpServer())
      .post('/tasks')
      .send({ title: 'e2e task', description: 'created by the e2e suite' })
      .expect(201);

    expect(created.body.title).toBe('e2e task');
    expect(created.body.status).toBe('open');

    await request(app.getHttpServer()).get(`/tasks/${created.body.id}`).expect(200);
  });

  it('POST /tasks rejects an invalid payload with 400', () => {
    return request(app.getHttpServer())
      .post('/tasks')
      .send({ title: '', hacker: true })
      .expect(400);
  });

  it('PATCH /tasks/:id updates and DELETE /tasks/:id removes', async () => {
    const created = await request(app.getHttpServer())
      .post('/tasks')
      .send({ title: 'to update' })
      .expect(201);

    const updated = await request(app.getHttpServer())
      .patch(`/tasks/${created.body.id}`)
      .send({ status: 'done' })
      .expect(200);
    expect(updated.body.status).toBe('done');

    await request(app.getHttpServer()).delete(`/tasks/${created.body.id}`).expect(204);
    await request(app.getHttpServer()).get(`/tasks/${created.body.id}`).expect(404);
  });

  it('GET /tasks?status=open filters by status', async () => {
    const response = await request(app.getHttpServer()).get('/tasks?status=open').expect(200);
    for (const task of response.body) {
      expect(task.status).toBe('open');
    }
  });
});
