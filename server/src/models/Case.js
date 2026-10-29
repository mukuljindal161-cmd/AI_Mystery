import mongoose from 'mongoose';
const { Schema } = mongoose;
const required = { type: String, required: true };
const CaseSchema = new Schema(
  {
    title: { ...required, maxlength: 120 },
    premise: { ...required, maxlength: 300 },
    difficulty: { ...required, enum: ['easy', 'medium', 'hard'] },
    story: { ...required, maxlength: 4000 },
    suspects: [
      {
        id: required,
        name: required,
        role: required,
        description: required,
        alibi: required,
        motive: required,
        _id: false,
      },
    ],
    clues: [
      {
        id: required,
        label: required,
        location: required,
        text: required,
        pointsTo: [String],
        isRedHerring: Boolean,
        discovered: { type: Boolean, default: false },
        discoveredAt: { type: Date, default: null },
        _id: false,
      },
    ],
    hints: [{ index: Number, text: String, _id: false }],
    solution: { culpritId: required, explanation: required, keyClueIds: [String] },
    progress: { hintsUsed: { type: Number, default: 0, min: 0 } },
    accusation: {
      suspectId: { type: String, default: null },
      correct: { type: Boolean, default: null },
      accusedAt: Date,
    },
    score: {
      basePoints: Number,
      clueBonus: Number,
      hintPenalty: Number,
      final: { type: Number, default: null },
    },
    status: { type: String, enum: ['active', 'completed'], default: 'active', index: true },
    completedAt: Date,
  },
  { timestamps: true, optimisticConcurrency: true },
);
export const Case = mongoose.model('Case', CaseSchema);
