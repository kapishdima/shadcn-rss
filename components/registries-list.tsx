"use client";

import React, { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
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
import { FeaturedRegistryCard } from "./featured-registry-card";

type RegistriesListProps = {
  registries: Registry[];
  featuredRegistries?: Registry[];
};

export const RegistriesList: React.FC<RegistriesListProps> = ({
  registries,
  featuredRegistries = [],
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

  const {
    loadPins,
    isPinned,
    isLoading: isPinsLoading,
    togglePin,
    pins = [],
  } = usePinnedRegistries();

  const unpinnedRegistry = filteredRegistries.filter(
    (registry) => !pins.find((pin) => pin.id === registry.id),
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

      <div className="relative min-h-[200px]">
        <AnimatePresence mode="wait">
          {isPinsLoading && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 z-20 bg-background/80 backdrop-blur-sm"
            >
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="h-5 w-32 bg-muted/50 rounded animate-pulse" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[...Array(2)].map((_, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-border/50 bg-card/50 p-4 space-y-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-full bg-muted/50 animate-pulse" />
                          <div className="space-y-2 flex-1">
                            <div className="h-4 w-1/3 bg-muted/50 animate-pulse rounded" />
                            <div className="h-3 w-1/4 bg-muted/50 animate-pulse rounded" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-3 w-full bg-muted/50 animate-pulse rounded" />
                          <div className="h-3 w-5/6 bg-muted/50 animate-pulse rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-border/50 bg-card/50 p-4 space-y-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-muted/50 animate-pulse" />
                        <div className="space-y-2 flex-1">
                          <div className="h-4 w-1/3 bg-muted/50 animate-pulse rounded" />
                          <div className="h-3 w-1/4 bg-muted/50 animate-pulse rounded" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 w-full bg-muted/50 animate-pulse rounded" />
                        <div className="h-3 w-5/6 bg-muted/50 animate-pulse rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {featuredRegistries.length > 0 && (
          <div className="mb-8 pb-8 border-b">
            <h4 className="pb-4 text-sm font-semibold text-muted-foreground">
              Official
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2">
              {featuredRegistries.map((registry) => (
                <motion.div
                  key={registry.name}
                  initial={{ opacity: 0, y: 24, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    opacity: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
                    y: {
                      type: "spring",
                      stiffness: 300,
                      damping: 25,
                      mass: 0.9,
                    },
                    scale: { type: "spring", stiffness: 400, damping: 30 },
                  }}
                  whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                >
                  <FeaturedRegistryCard
                    registry={registry}
                    isSelected={selection.includes(registry.name)}
                    onToggle={handleToggleSelection}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {pins?.length > 0 && (
            <motion.div
              key="pinned-section"
              initial={{ opacity: 0, height: 0, overflow: "hidden" }}
              animate={{
                opacity: 1,
                height: "auto",
                transitionEnd: { overflow: "visible" },
              }}
              exit={{
                opacity: 0,
                height: 0,
                overflow: "hidden",
              }}
              transition={{
                opacity: { duration: 0.2 },
                height: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
              }}
              className="mb-8 pb-8 border-b"
            >
              <motion.h4
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="pb-4 text-sm font-semibold text-muted-foreground"
              >
                Pinned registries
              </motion.h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2 ">
                <AnimatePresence mode="popLayout">
                  {pins.map((registry, index) => (
                    <motion.div
                      key={registry.name}
                      layout
                      initial={{
                        opacity: 0,
                        y: 24,
                        scale: 0.96,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        scale: 1,
                      }}
                      exit={{
                        opacity: 0,
                        scale: 0.92,
                        y: -12,
                        transition: { duration: 0.2 },
                      }}
                      transition={{
                        layout: {
                          type: "spring",
                          stiffness: 350,
                          damping: 30,
                          mass: 0.8,
                        },
                        opacity: {
                          duration: 0.4,
                          ease: [0.4, 0, 0.2, 1],
                        },
                        y: {
                          type: "spring",
                          stiffness: 300,
                          damping: 25,
                          mass: 0.9,
                        },
                        scale: {
                          type: "spring",
                          stiffness: 400,
                          damping: 30,
                        },
                        delay: index * 0.03,
                      }}
                      whileHover={{
                        scale: 1.02,
                        transition: { duration: 0.2 },
                      }}
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
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className={cn(
            "grid grid-cols-1 md:grid-cols-2 gap-4 p-1 -m-1 transition-opacity duration-200",
            isPinsLoading ? "opacity-0" : "opacity-100",
          )}
        >
          <AnimatePresence mode="popLayout">
            {unpinnedRegistry.map((registry, index) => (
              <motion.div
                key={registry.name}
                layout
                initial={{
                  opacity: 0,
                  y: 24,
                  scale: 0.96,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.92,
                  y: -12,
                  transition: { duration: 0.2 },
                }}
                transition={{
                  layout: {
                    type: "spring",
                    stiffness: 350,
                    damping: 30,
                    mass: 0.8,
                  },
                  opacity: {
                    duration: 0.4,
                    ease: [0.4, 0, 0.2, 1],
                  },
                  y: {
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                    mass: 0.9,
                  },
                  scale: {
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                  },
                  delay: index * 0.03,
                }}
                whileHover={{
                  scale: 1.02,
                  transition: { duration: 0.2 },
                }}
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
          </AnimatePresence>
        </div>
      </div>

      <SelectionBar
        selectedRegistries={selectedRegistries}
        onClear={() => setSelection(null)}
      />
    </div>
  );
};
