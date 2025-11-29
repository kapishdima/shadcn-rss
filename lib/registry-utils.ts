import { Registry } from "@/types";

const normalizeQuery = (query: string) =>
  query.toLowerCase().replaceAll(" ", "").replaceAll("@", "");

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
