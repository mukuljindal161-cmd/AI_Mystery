import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { randomBytes } from 'node:crypto';
import { createApp } from '../app.js';
import { ApiError } from '../middleware/errorHandler.js';
const env = { MOCK_AI: true, CLIENT_ORIGIN: 'http://localhost:5173', TRUST_PROXY: 0 };
function testRepository() {
  const records = new Map();
  return {
    async create(data) {
      const doc = { ...data, _id: randomBytes(12).toString('hex'), createdAt: new Date() };
      records.set(doc._id, doc);
      return structuredClone(doc);
    },
    async get(id) {
      if (!records.has(id)) throw new ApiError(404, 'CASE_NOT_FOUND', 'Case not found.');
      return structuredClone(records.get(id));
    },
    async mutate(id, update) {
      const doc = records.get(id);
      if (!doc) throw new ApiError(404, 'CASE_NOT_FOUND', 'Case not found.');
      if (doc.status !== 'active')
        throw new ApiError(409, 'CASE_ALREADY_COMPLETED', 'Case complete.');
      const next = structuredClone(doc);
      update(next);
      records.set(id, next);
      return structuredClone(next);
    },
  };
}
function assertSecret(body, undiscovered = []) {
  const forbidden = new Set([
    'solution',
    'culpritId',
    'explanation',
    'motive',
    'pointsTo',
    'isRedHerring',
  ]);
  const scan = (item) => {
    if (item && typeof item === 'object')
      for (const [key, value] of Object.entries(item)) {
        expect(forbidden.has(key), key).toBe(false);
        scan(value);
      }
  };
  scan(body);
  for (const text of undiscovered) expect(JSON.stringify(body)).not.toContain(text);
}
let app, repo;
beforeEach(() => {
  repo = testRepository();
  app = createApp(env, { repository: repo, rateLimits: false });
});
async function create(difficulty = 'medium') {
  return request(app)
    .post('/api/cases')
    .send({ premise: 'A compass disappears from a gallery', difficulty })
    .expect(201);
}
describe('case API', () => {
  it('health endpoint', async () => {
    expect((await request(app).get('/api/health')).body).toEqual({ status: 'ok' });
  });
  for (const difficulty of ['easy', 'medium', 'hard'])
    it(`complete ${difficulty} playthrough with secrecy and persistent state`, async () => {
      const created = await create(difficulty),
        id = created.body.case.id,
        stored = await repo.get(id);
      assertSecret(
        created.body,
        stored.clues.map((c) => c.text),
      );
      const earlyResult = await request(app).get(`/api/cases/${id}/result`).expect(409);
      assertSecret(earlyResult.body);
      for (const clue of stored.clues) {
        const found = await request(app)
          .post(`/api/cases/${id}/clues/${clue.id}/discover`)
          .send({})
          .expect(200);
        assertSecret(
          found.body,
          stored.clues.filter((c) => c.id !== clue.id).map((c) => c.text),
        );
        expect(found.body.clue.text).toBe(clue.text);
      }
      const twice = await request(app)
        .post(`/api/cases/${id}/clues/c1/discover`)
        .send({})
        .expect(200);
      expect(twice.body.score.current).toBe(stored.clues.length * 5);
      for (let index = 0; index < stored.hints.length; index++) {
        const hint = await request(app).post(`/api/cases/${id}/hints`).send({}).expect(200);
        expect(hint.body.hint.index).toBe(index);
        assertSecret(hint.body);
        expect(hint.body.hint.text).toBe(stored.hints[index].text);
      }
      await request(app).post(`/api/cases/${id}/hints`).send({}).expect(409);
      const refreshed = await request(app).get(`/api/cases/${id}`).expect(200);
      assertSecret(refreshed.body);
      expect(refreshed.body.case.progress.cluesFound).toBe(stored.clues.length);
      expect(refreshed.body.case.hints.revealed).toHaveLength(stored.hints.length);
      const result = await request(app)
        .post(`/api/cases/${id}/accuse`)
        .send({ suspectId: stored.solution.culpritId })
        .expect(200);
      expect(result.body.result.correct).toBe(true);
      expect(result.body.result.clues).toHaveLength(stored.clues.length);
      expect(result.body.result.score.final).toBe(
        { easy: 100, medium: 150, hard: 200 }[difficulty] +
          5 * stored.clues.length -
          10 * stored.hints.length,
      );
      expect((await request(app).get(`/api/cases/${id}/result`).expect(200)).body).toEqual(
        result.body,
      );
      await request(app).post(`/api/cases/${id}/accuse`).send({ suspectId: 's2' }).expect(409);
      await request(app).post(`/api/cases/${id}/clues/c1/discover`).send({}).expect(409);
      await request(app).post(`/api/cases/${id}/hints`).send({}).expect(409);
      assertSecret((await request(app).get(`/api/cases/${id}`)).body);
    });
  it('wrong accusation reveals missed clues and floors the score', async () => {
    const id = (await create()).body.case.id;
    await request(app).post(`/api/cases/${id}/hints`).send({});
    const { body } = await request(app)
      .post(`/api/cases/${id}/accuse`)
      .send({ suspectId: 's2' })
      .expect(200);
    expect(body.result.correct).toBe(false);
    expect(body.result.score.final).toBe(0);
    expect(body.result.clues.every((c) => c.text && !c.discovered)).toBe(true);
  });
  it('rejects bad IDs, unknown records and clues', async () => {
    await request(app).get('/api/cases/no').expect(400);
    await request(app).get('/api/cases/aaaaaaaaaaaaaaaaaaaaaaaa').expect(404);
    const id = (await create('easy')).body.case.id;
    await request(app).post(`/api/cases/${id}/clues/c9/discover`).send({}).expect(404);
    await request(app).post(`/api/cases/${id}/accuse`).send({ suspectId: 's5' }).expect(400);
  });
  it('rejects invalid input and client score tampering', async () => {
    for (const premise of ['', 'short', 'x'.repeat(301)])
      await request(app).post('/api/cases').send({ premise, difficulty: 'easy' }).expect(400);
    await request(app)
      .post('/api/cases')
      .send({ premise: 'Valid length premise', difficulty: 'impossible' })
      .expect(400);
    const id = (await create()).body.case.id;
    await request(app)
      .post(`/api/cases/${id}/accuse`)
      .send({ suspectId: 's1', score: 999, cluesFound: 99 })
      .expect(400);
    const result = await request(app)
      .post(`/api/cases/${id}/accuse`)
      .send({ suspectId: 's1' })
      .expect(200);
    expect(result.body.result.score.final).toBe(150);
  });
  it('rejects malformed JSON with the standard error shape', async () => {
    const response = await request(app)
      .post('/api/cases')
      .set('Content-Type', 'application/json')
      .send('{')
      .expect(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
  it('enforces creation rate limits', async () => {
    app = createApp(env, { repository: repo });
    for (let i = 0; i < 5; i++) await create();
    const response = await request(app)
      .post('/api/cases')
      .send({ premise: 'A mysterious compass', difficulty: 'easy' })
      .expect(429);
    expect(response.body.error.code).toBe('RATE_LIMITED');
  });
});
