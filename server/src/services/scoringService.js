import { DIFFICULTY } from '../config/difficulty.js';
export function calculateScore({ difficulty, correct, cluesFound, hintsUsed }) {
  const basePoints = correct ? DIFFICULTY[difficulty].base : 0;
  const clueBonus = cluesFound * 5;
  const hintPenalty = hintsUsed * 10;
  return {
    basePoints,
    clueBonus,
    hintPenalty,
    final: Math.max(0, basePoints + clueBonus - hintPenalty),
  };
}
