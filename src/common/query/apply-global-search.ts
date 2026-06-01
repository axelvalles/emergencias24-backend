import { type ObjectLiteral, type SelectQueryBuilder } from 'typeorm';

interface GlobalSearchOptions {
  query: string | undefined;
  expressions: string[];
  paramName?: string;
}

export function applyGlobalSearch<T extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<T>,
  options: GlobalSearchOptions,
): void {
  const { query, expressions, paramName = 'globalSearch' } = options;

  const normalizedQuery = query?.trim().toLowerCase();
  if (!normalizedQuery || expressions.length === 0) {
    return;
  }

  const whereClause = expressions
    .map(
      (expression) => `LOWER(COALESCE(${expression}, '')) LIKE :${paramName}`,
    )
    .join(' OR ');

  queryBuilder.andWhere(`(${whereClause})`, {
    [paramName]: `%${normalizedQuery}%`,
  });
}
