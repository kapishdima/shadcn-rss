"use client";

import { debounce, parseAsArrayOf, parseAsString, useQueryState } from "nuqs";

import { findRegistry } from "@/lib/registries-client-utils";
import { Registry } from "@/types";

export function useRegistryState(registries: Registry[]) {
  const [query, setQuery] = useQueryState("q", {
    defaultValue: "",
    limitUrlUpdates: debounce(250),
  });

  const [selection, setSelection] = useQueryState(
    "selection",
    parseAsArrayOf(parseAsString).withDefault([])
  );

  const filteredRegistries = findRegistry(query, registries);

  const handleToggleSelection = (registry: Registry) => {
    setSelection((prev) => {
      const isSelected = prev.includes(registry.name);
      if (isSelected) {
        return prev.filter((name) => name !== registry.name);
      }
      return [...prev, registry.name];
    });
  };

  const selectedRegistries = registries.filter((r) =>
    selection.includes(r.name)
  );

  return {
    query,
    setQuery,
    selection,
    setSelection,
    filteredRegistries,
    selectedRegistries,
    handleToggleSelection,
  };
}
