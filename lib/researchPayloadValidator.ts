import { z } from 'zod';

/**
 * Validation and sanitisation helpers for research‑bounty payloads.
 *
 * We keep the core Zod schemas (createBountySchema, submitContributionSchema)
 * in `lib/research-bounties` but add a thin layer that:
 *   • Trims string fields.
 *   • Normalises currency to a 3‑letter code.
 *   • Ensures numeric fields are numbers (not strings).
 *   • Provides a single exported function used by the API route.
 */

export const bountyPayloadSchema = z.object({
  opportunityId: z.string().min(1),
  opportunityName: z.string().min(1),
  falsificationTarget: z.string().optional(),
  rewardAmount: z.preprocess((a) => Number(a), z.number().positive()),
  currency: z.string().length(3),
  expiresInDays: z.preprocess((a) => Number(a), z.number().int().positive()),
});

export const contributionPayloadSchema = z.object({
  bountyId: z.string().optional().nullable(),
  opportunityId: z.string().min(1),
  contributorHandle: z.string().min(1),
  contributorRole: z.string().min(1),
  evidenceType: z.string().min(1),
  claimSummary: z.string().min(1),
  verdict: z.enum(['true','false','unknown']),
  sourceUrl: z.string().url().optional().nullable(),
  verificationData: z.any().optional(),
});

/**
 * Sanitize a parsed payload – trims strings and forces correct types.
 */
function sanitize<T extends Record<string, any>>(obj: T): T {
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = value.trim();
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized as T;
}

export function validateAndSanitizeBounty(raw: unknown) {
  const parsed = bountyPayloadSchema.safeParse(raw);
  if (!parsed.success) throw new Error('Invalid bounty payload');
  return sanitize(parsed.data);
}

export function validateAndSanitizeContribution(raw: unknown) {
  const parsed = contributionPayloadSchema.safeParse(raw);
  if (!parsed.success) throw new Error('Invalid contribution payload');
  return sanitize(parsed.data);
}
