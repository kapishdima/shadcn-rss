"use client";

import * as React from "react";
import { motion } from "motion/react";
import { Search, X } from "lucide-react";
import { debounce, useQueryState } from "nuqs";

import { Registry } from "@/types";
import { findRegistry } from "@/lib/data";
import { Field } from "./ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "./ui/input-group";
import { RegistryCard } from "./registry-card";

type RegistriesListProps = {
  registries: Registry[];
};

export const RegistriesList: React.FC<RegistriesListProps> = ({
  registries,
}) => {
  const [query, setQuery] = useQueryState("q", {
    defaultValue: "",
    limitUrlUpdates: debounce(250),
  });

  const filteredRegistries = findRegistry(query, registries);

  return (
    <div className="mt-6 w-full">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRegistries.map((registry, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <RegistryCard registry={registry} />
          </motion.div>
        ))}
      </div>
    </div>
  );
};
