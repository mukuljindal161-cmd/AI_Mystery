import { describe, it, expect } from 'vitest';
import { calculateScore } from '../services/scoringService.js';
import { DIFFICULTY } from '../config/difficulty.js';
describe('server scoring', () => {
  for (const [difficulty, d] of Object.entries(DIFFICULTY)) {
    it(`${difficulty}: correct and incorrect verdicts, maximum, penalties and floor`, () => {
      expect(
        calculateScore({ difficulty, correct: true, cluesFound: d.clues, hintsUsed: 0 }).final,
      ).toBe(d.base + d.clues * 5);
      expect(
        calculateScore({ difficulty, correct: false, cluesFound: d.clues, hintsUsed: 0 }).final,
      ).toBe(d.clues * 5);
      expect(
        calculateScore({ difficulty, correct: false, cluesFound: 0, hintsUsed: d.hints }).final,
      ).toBe(0);
      expect(calculateScore({ difficulty, correct: true, cluesFound: 2, hintsUsed: 1 }).final).toBe(
        d.base,
      );
    });
  }
  it('matches the documented medium example', () =>
    expect(
      calculateScore({ difficulty: 'medium', correct: true, cluesFound: 5, hintsUsed: 1 }),
    ).toEqual({ basePoints: 150, clueBonus: 25, hintPenalty: 10, final: 165 }));
});
