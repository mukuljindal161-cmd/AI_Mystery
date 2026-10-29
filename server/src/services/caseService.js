import { calculateScore } from './scoringService.js';
import { ApiError } from '../middleware/errorHandler.js';
export const foundCount = (doc) => doc.clues.filter((c) => c.discovered).length;
export const publicSuspect = (s) => ({
  id: s.id,
  name: s.name,
  role: s.role,
  description: s.description,
  alibi: s.alibi,
});
export const publicClue = (c, reveal = false) => ({
  id: c.id,
  label: c.label,
  location: c.location,
  discovered: c.discovered,
  ...(c.discovered || reveal ? { text: c.text, discoveredAt: c.discoveredAt } : {}),
});
export function progressOf(doc) {
  return {
    cluesFound: foundCount(doc),
    cluesTotal: doc.clues.length,
    hintsUsed: doc.progress.hintsUsed,
    hintsTotal: doc.hints.length,
  };
}
export function evidenceScore(doc) {
  return { current: Math.max(0, 5 * foundCount(doc) - 10 * doc.progress.hintsUsed) };
}
export function toPublicCase(doc) {
  return {
    id: String(doc._id),
    title: doc.title,
    premise: doc.premise,
    difficulty: doc.difficulty,
    story: doc.story,
    suspects: doc.suspects.map(publicSuspect),
    clues: doc.clues.map((c) => publicClue(c)),
    hints: {
      total: doc.hints.length,
      used: doc.progress.hintsUsed,
      revealed: doc.hints
        .slice(0, doc.progress.hintsUsed)
        .map((h) => ({ index: h.index, text: h.text })),
    },
    progress: progressOf(doc),
    status: doc.status,
    score: evidenceScore(doc),
    createdAt: doc.createdAt,
  };
}
export function toResult(doc) {
  if (doc.status !== 'completed')
    throw new ApiError(
      409,
      'CASE_NOT_COMPLETE',
      'Finish your investigation before viewing the result.',
    );
  return {
    caseId: String(doc._id),
    title: doc.title,
    difficulty: doc.difficulty,
    correct: doc.accusation.correct,
    accusedSuspectId: doc.accusation.suspectId,
    culprit: publicSuspect(doc.suspects.find((s) => s.id === doc.solution.culpritId)),
    explanation: doc.solution.explanation,
    keyClueIds: [...doc.solution.keyClueIds],
    clues: doc.clues.map((c) => publicClue(c, true)),
    suspects: doc.suspects.map(publicSuspect),
    score: {
      basePoints: doc.score.basePoints,
      clueBonus: doc.score.clueBonus,
      hintPenalty: doc.score.hintPenalty,
      final: doc.score.final,
      cluesFound: foundCount(doc),
      hintsUsed: doc.progress.hintsUsed,
    },
    completedAt: doc.completedAt,
  };
}
export function completeCase(doc, suspectId) {
  if (!doc.suspects.some((s) => s.id === suspectId))
    throw new ApiError(400, 'VALIDATION_ERROR', 'Choose a suspect from this case.');
  const correct = suspectId === doc.solution.culpritId;
  doc.accusation = { suspectId, correct, accusedAt: new Date() };
  doc.score = calculateScore({
    difficulty: doc.difficulty,
    correct,
    cluesFound: foundCount(doc),
    hintsUsed: doc.progress.hintsUsed,
  });
  doc.status = 'completed';
  doc.completedAt = new Date();
}
