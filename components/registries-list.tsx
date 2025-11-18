"use client";

import * as React from "react";

import { Registry } from "@/types";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "@/components/ui/item";
import { RegistryUpdate } from "./registry-update";
import { WithoutRss } from "./without-rss";
import { Field } from "./ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "./ui/input-group";
import { Search, X } from "lucide-react";
import { debounce, useQueryState } from "nuqs";
import { findRegistry } from "@/lib/data";

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

  return (
    <div className="mt-6">
      <Field>
        <InputGroup>
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Search"
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
      <ItemGroup className="my-8">
        {findRegistry(query, registries).map((registry, index) => (
          <React.Fragment key={index}>
            <Item className="group/item relative gap-6 px-0">
              <ItemMedia
                variant="image"
                dangerouslySetInnerHTML={{ __html: registry.logo }}
                className="*:[svg]:fill-foreground grayscale *:[svg]:size-8"
              />
              <ItemContent>
                <ItemTitle>{registry.name}</ItemTitle>
                {registry.description && (
                  <ItemDescription className="max-w-[70%] text-balance">
                    {registry.description}
                  </ItemDescription>
                )}
              </ItemContent>
              <ItemActions className="relative z-10 hidden self-start sm:flex">
                <RegistryUpdate registry={registry} />
                {!registry.feed && <WithoutRss />}
              </ItemActions>
            </Item>
            {index < registries.length - 1 && (
              <ItemSeparator className="my-1" />
            )}
          </React.Fragment>
        ))}
      </ItemGroup>
    </div>
  );
};
