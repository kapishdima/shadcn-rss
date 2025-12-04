import { Registry } from "@/types";
import { normalizeQuery } from "@/utils/strings";

/**
 * Find registries matching a search query
 * This is a pure function that can be used on both server and client
 */
export function findRegistry(
  query: string,
  registries: Registry[]
): Registry[] {
  const normalizedQuery = normalizeQuery(query);
  return registries.filter((registry) =>
    registry.searchKeywords?.some((keyword) =>
      keyword.includes(normalizedQuery)
    )
  );
}
