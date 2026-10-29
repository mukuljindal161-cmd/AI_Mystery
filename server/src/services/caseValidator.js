import { z } from 'zod';
import { DIFFICULTY } from '../config/difficulty.js';
const text = (max) => z.string().trim().min(1).max(max);
export const generatedCaseSchema = z.object({
  title: text(120),
  story: text(4000),
  suspects: z.array(
    z.object({
      id: text(8),
      name: text(80),
      role: text(120),
      description: text(600),
      alibi: text(600),
      motive: text(600),
    }),
  ),
  clues: z.array(
    z.object({
      id: text(8),
      label: text(100).refine((s) => s.split(/\s+/).length <= 8),
      location: text(120),
      text: text(500),
      pointsTo: z.array(text(8)),
      isRedHerring: z.boolean(),
    }),
  ),
  hints: z.array(text(500)),
  solution: z.object({ culpritId: text(8), explanation: text(2000), keyClueIds: z.array(text(8)) }),
});
const unsafe =
  /\b(explicit sex|sexual intercourse|dismembered|disemboweled|graphic gore|Donald Trump|Joe Biden|Narendra Modi|Elon Musk|Taylor Swift)\b/i;
function check(condition, name) {
  if (!condition) throw new Error(name);
}
export function validateCase(raw, difficulty, logger = console) {
  const parsed =
    typeof raw === 'string'
      ? JSON.parse(
          raw
            .trim()
            .replace(/^```(?:json)?\s*/i, '')
            .replace(/\s*```$/, ''),
        )
      : raw;
  const c = generatedCaseSchema.parse(parsed);
  const config = DIFFICULTY[difficulty];
  check(config, 'difficulty');
  check(
    c.suspects.length === config.suspects &&
      c.clues.length === config.clues &&
      c.hints.length === config.hints,
    'counts',
  );
  const ids = c.suspects.map((s) => s.id),
    clueIds = c.clues.map((cl) => cl.id);
  check(
    new Set(ids).size === ids.length &&
      ids.every((id) => new RegExp(`^s[1-${config.suspects}]$`).test(id)),
    'suspect_ids',
  );
  check(
    new Set(clueIds).size === clueIds.length &&
      clueIds.every((id) => new RegExp(`^c[1-${config.clues}]$`).test(id)),
    'clue_ids',
  );
  check(
    new Set(c.suspects.map((s) => s.name.toLowerCase())).size === ids.length,
    'duplicate_names',
  );
  check(ids.includes(c.solution.culpritId), 'culprit_reference');
  check(
    c.clues.every((cl) => cl.pointsTo.every((id) => ids.includes(id))) &&
      c.solution.keyClueIds.every((id) => clueIds.includes(id)),
    'clue_references',
  );
  check(
    new Set(c.solution.keyClueIds).size === c.solution.keyClueIds.length &&
      c.solution.keyClueIds.length >= (difficulty === 'easy' ? 2 : 3),
    'key_clue_count',
  );
  check(
    c.solution.keyClueIds.every((id) =>
      c.clues.some(
        (cl) => cl.id === id && !cl.isRedHerring && cl.pointsTo.includes(c.solution.culpritId),
      ),
    ),
    'key_clue_evidence',
  );
  const implicated = (id) =>
    c.clues.filter((cl) => !cl.isRedHerring && cl.pointsTo.includes(id)).length;
  check(
    ids
      .filter((id) => id !== c.solution.culpritId)
      .every((id) => implicated(id) < implicated(c.solution.culpritId)),
    'culprit_most_implicated',
  );
  const red = c.clues.filter((cl) => cl.isRedHerring).length;
  check(red <= config.maxRedHerrings && (difficulty === 'easy' || red >= 1), 'red_herrings');
  const culprit = c.suspects.find((s) => s.id === c.solution.culpritId);
  const escapedName = culprit.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const spoiler = new RegExp(
    `(?:${escapedName}[^.!?]{0,45}(?:did it|is (?:the )?(?:culprit|guilty|murderer|thief|killer))|(?:culprit|murderer|thief|killer) is[^.!?]{0,15}${escapedName})`,
    'i',
  );
  check(
    [
      c.story,
      ...c.suspects.flatMap((s) => [s.description, s.role, s.alibi]),
      ...c.clues.flatMap((cl) => [cl.label, cl.location]),
      ...c.hints,
    ].every((t) => !spoiler.test(t)),
    'spoiler',
  );
  check(
    c.hints.every((h) => !h.toLowerCase().includes(culprit.name.toLowerCase())),
    'hint_spoiler',
  );
  check(!unsafe.test(JSON.stringify(c)), 'safety');
  // Narrative entailment cannot be proven from pointsTo metadata. Keep this
  // explicitly soft; an optional independent solver is a future enhancement.
  for (const suspect of c.suspects.filter((s) => s.id !== culprit.id)) {
    if (c.clues.some((cl) => !cl.isRedHerring && cl.pointsTo.includes(suspect.id)))
      logger.warn('innocent_alibi_needs_review');
  }
  return {
    ...c,
    clues: c.clues.map((cl) => ({ ...cl, discovered: false, discoveredAt: null })),
    hints: c.hints.map((t, index) => ({ index, text: t })),
  };
}
