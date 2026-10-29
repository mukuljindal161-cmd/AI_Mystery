import { afterEach, expect, it, vi } from 'vitest';
import { Case } from '../models/Case.js';
import { caseRepository } from '../services/caseRepository.js';
import { completeCase } from '../services/caseService.js';
import { validateCase } from '../services/caseValidator.js';
import { mockCase } from '../services/mockCase.js';
afterEach(() => vi.restoreAllMocks());
it('retries version conflicts against fresh state and refuses a concurrent second accusation', async () => {
  let state = {
    ...validateCase(mockCase('easy'), 'easy'),
    difficulty: 'easy',
    progress: { hintsUsed: 0 },
    status: 'active',
    __v: 0,
  };
  vi.spyOn(Case, 'findById').mockImplementation(async () => {
    const doc = structuredClone(state);
    doc.save = async () => {
      if (doc.__v !== state.__v)
        throw Object.assign(new Error('conflict'), { name: 'VersionError' });
      const { save, ...data } = doc;
      state = structuredClone({ ...data, __v: data.__v + 1 });
    };
    return doc;
  });
  const results = await Promise.allSettled([
    caseRepository.mutate('id', (doc) => completeCase(doc, 's1')),
    caseRepository.mutate('id', (doc) => completeCase(doc, 's2')),
  ]);
  expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
  expect(results.find((r) => r.status === 'rejected').reason.code).toBe('CASE_ALREADY_COMPLETED');
  expect(state.accusation.suspectId).toBe('s1');
});
it('model has optimistic concurrency enabled', () =>
  expect(Case.schema.options.optimisticConcurrency).toBe(true));
