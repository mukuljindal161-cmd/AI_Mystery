import { describe, it, expect } from 'vitest';
import { validateCase } from '../services/caseValidator.js';
import { mockCase } from '../services/mockCase.js';
describe('AI output validation', () => {
  for (const difficulty of ['easy', 'medium', 'hard'])
    it(`normalizes a valid ${difficulty} case`, () => {
      const result = validateCase(mockCase(difficulty), difficulty);
      expect(result.clues.every((c) => !c.discovered)).toBe(true);
      expect(result.hints[0].index).toBe(0);
    });
  const failures = [
    ['wrong counts', (c) => c.suspects.pop()],
    [
      'duplicate IDs',
      (c) => {
        c.suspects[1].id = 's1';
      },
    ],
    [
      'duplicate names',
      (c) => {
        c.suspects[1].name = c.suspects[0].name.toUpperCase();
      },
    ],
    [
      'unknown culprit',
      (c) => {
        c.solution.culpritId = 's99';
      },
    ],
    [
      'unknown clue reference',
      (c) => {
        c.clues[0].pointsTo = ['s99'];
      },
    ],
    [
      'equal implication',
      (c) => {
        c.clues.forEach((cl) => {
          if (cl.pointsTo.includes('s1')) cl.pointsTo.push('s2');
        });
      },
    ],
    [
      'red herring key clue',
      (c) => {
        c.clues[0].isRedHerring = true;
      },
    ],
    [
      'duplicate key clues',
      (c) => {
        c.solution.keyClueIds = ['c1', 'c1', 'c1'];
      },
    ],
    [
      'hint spoiler',
      (c) => {
        c.hints[0] = 'Investigate Clara Vale.';
      },
    ],
    [
      'story spoiler',
      (c) => {
        c.story += ' Clara Vale is guilty.';
      },
    ],
    [
      'description spoiler',
      (c) => {
        c.suspects[1].description = 'Clara Vale did it.';
      },
    ],
    [
      'unsafe output',
      (c) => {
        c.story += ' Explicit sex.';
      },
    ],
    [
      'excessive length',
      (c) => {
        c.title = 'x'.repeat(121);
      },
    ],
  ];
  for (const [name, mutate] of failures)
    it(`rejects ${name}`, () => {
      const c = mockCase('medium');
      mutate(c);
      expect(() => validateCase(c, 'medium')).toThrow();
    });
  it('strips unknown fields and markdown fences', () => {
    const c = mockCase('easy');
    c.untrusted = 'discard';
    expect(
      validateCase('```json\n' + JSON.stringify(c) + '\n```', 'easy').untrusted,
    ).toBeUndefined();
  });
});
