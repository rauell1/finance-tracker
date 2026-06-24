const DEFAULT_PAGE_SIZE = 1000;

/**
 * Fetches all rows from a Supabase query using range-based pagination.
 * Eliminates the repeated while-loop pattern used in dashboard queries.
 *
 * @param buildQuery - Function returning a fresh query builder (called per page
 *   to apply the .range() cleanly).
 */
export async function fetchAllPaginated<T>(
  buildQuery: () => { range: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }> },
  pageSize = DEFAULT_PAGE_SIZE
): Promise<T[]> {
  let results: T[] = [];
  let page = 0;
  while (true) {
    const { data, error } = await buildQuery().range(
      page * pageSize,
      (page + 1) * pageSize - 1
    );
    if (error) throw error;
    if (!data || data.length === 0) break;
    results = results.concat(data);
    if (data.length < pageSize) break;
    page++;
  }
  return results;
}
