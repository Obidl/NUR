import { AppError } from '../errors/AppError.js';
import type { ContentStatus } from './content.js';

const NON_PUBLISH_TRANSITIONS: Record<ContentStatus, ContentStatus[]> = {
  draft: ['in_review', 'archived'],
  in_review: ['draft', 'archived'],
  published: ['draft', 'archived'],
  archived: ['draft'],
};

/** Editorial status changes that do not go through publish gates. */
export function assertEditorialStatusTransition(
  from: ContentStatus,
  to: ContentStatus,
): void {
  if (to === 'published') {
    throw new AppError(
      'VALIDATION_ERROR',
      'Use the publish endpoint to set published status',
      422,
    );
  }

  const allowed = NON_PUBLISH_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new AppError(
      'VALIDATION_ERROR',
      `Cannot change status from ${from} to ${to}`,
      422,
    );
  }
}
