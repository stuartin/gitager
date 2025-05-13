import { z } from 'zod';

export type ID = z.infer<typeof IDSchema>;
export const IDSchema = z.string().cuid2().describe("A unique cuid2 formatted id.")

export type CursorPagination = z.infer<typeof CursorPaginationSchema>;
export const CursorPaginationSchema = z.object({
    order: z.enum(['asc', 'desc']).default('asc').describe('Sort responses by id (ascending or descending).'),
    limit: z.number().int().min(1).max(100).default(10).describe('Limit the number of items returned.'),
    cursor: z.string().cuid2().optional().describe('The id to use as a starting cursor.'),
});
