import { Case } from '../models/Case.js';
import { ApiError } from '../middleware/errorHandler.js';
const notFound = () =>
  new ApiError(404, 'CASE_NOT_FOUND', 'Case not found. Start a new investigation.');
export const caseRepository = {
  create: (data) => Case.create(data),
  async get(id) {
    const doc = await Case.findById(id);
    if (!doc) throw notFound();
    return doc;
  },
  // Optimistic concurrency retries against fresh state: simultaneous hints, clues,
  // and accusations cannot overwrite each other or mutate a completed case.
  async mutate(id, update) {
    for (let attempt = 0; attempt < 8; attempt++) {
      const doc = await this.get(id);
      if (doc.status !== 'active')
        throw new ApiError(409, 'CASE_ALREADY_COMPLETED', 'This case is complete.');
      update(doc);
      try {
        await doc.save();
        return doc;
      } catch (error) {
        if (error.name !== 'VersionError') throw error;
      }
    }
    throw new ApiError(409, 'CASE_BUSY', 'Another action is being saved. Please try again.');
  },
};
