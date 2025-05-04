import { z } from 'zod';

export const CursorPaginationSchema = z.object({
  order: z.enum(['asc', 'desc']).default('asc').describe('Sort responses by id (ascending or descending).'),
  limit: z.number().int().min(1).max(100).default(10).describe('Limit the number of items returned.'),
  cursor: z.string().cuid2().optional().describe('The id to use as a starting cursor.'),
});
