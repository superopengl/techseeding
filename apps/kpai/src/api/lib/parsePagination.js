const DEFAULT_PAGE_SIZE = 100;
const MAX_PAGE_SIZE = 500;

export function parsePagination(query) {
  const rawPage = Number(query?.page);
  const rawPageSize = Number(query?.pageSize);
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1;
  const pageSize = Number.isFinite(rawPageSize) && rawPageSize >= 1
    ? Math.min(Math.floor(rawPageSize), MAX_PAGE_SIZE)
    : DEFAULT_PAGE_SIZE;
  return { page, pageSize, limit: pageSize, offset: (page - 1) * pageSize };
}
