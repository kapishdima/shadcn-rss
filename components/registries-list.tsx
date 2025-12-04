"use client";

import React, { useEffect } from "react";
import { motion } from "motion/react";
import { Search, X } from "lucide-react";

import { Registry } from "@/types";
import { useRegistryState } from "@/hooks/use-registry-state";

import { Field } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

import { RegistryCard } from "./registry-card";
import { SelectionBar } from "./selection-bar";
import { usePinnedRegistries } from "@/hooks/use-pinned-registries";

type RegistriesListProps = {
  registries: Registry[];
};

export const RegistriesList: React.FC<RegistriesListProps> = ({
  registries,
}) => {
  const {
    query,
    selection,
    filteredRegistries,
    selectedRegistries,
    setQuery,
    setSelection,
    handleToggleSelection,
  } = useRegistryState(registries);

  const { loadPins, isPinned, togglePin, pins = [] } = usePinnedRegistries();

  console.log("pins", pins);
  const unpinnedRegistry = filteredRegistries.filter(
    (registry) => !pins.find((pin) => pin.id === registry.id)
  );

  useEffect(() => {
    loadPins();
  }, []);

  return (
    <div className="mt-6 w-full pb-20">
      <Field className="mb-8">
        <InputGroup className="bg-background dark:bg-background">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Search registries..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <InputGroupAddon
            align="inline-end"
            data-disabled={!query.length}
            className="data-[disabled=true]:hidden"
          >
            <InputGroupButton
              aria-label="Clear"
              title="Clear"
              size="icon-xs"
              onClick={() => setQuery(null)}
            >
              <X />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </Field>

      {pins?.length > 0 && (
        <div className="mb-8 pb-8 border-b">
          <h4 className="pb-4 text-sm font-semibold text-muted-foreground">
            Pins regisries
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pins.map((registry, index) => (
              <motion.div
                key={registry.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                layout
              >
                <RegistryCard
                  registry={registry}
                  isSelected={selection.includes(registry.name)}
                  onToggle={handleToggleSelection}
                  isPinned={isPinned(registry.name)}
                  togglePin={() => togglePin(registry)}
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {unpinnedRegistry.map((registry, index) => (
          <motion.div
            key={registry.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            layout
          >
            <RegistryCard
              registry={registry}
              isSelected={selection.includes(registry.name)}
              onToggle={handleToggleSelection}
              isPinned={isPinned(registry.name)}
              togglePin={() => togglePin(registry)}
            />
          </motion.div>
        ))}
      </div>

      <SelectionBar
        selectedRegistries={selectedRegistries}
        onClear={() => setSelection(null)}
      />
    </div>
  );
};
