"use client";

import React, { use, useEffect } from "react";
import { useQueryState } from "nuqs";

import { Registry } from "@/types";
import { RegistriesList } from "./registries-list";
import { LatestChangesList } from "./latest-changes-list";
import { ActivityGraph } from "./activity-graph";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { usePinnedRegistries } from "@/hooks/use-pinned-registries";

type RegistriesPageContentProps = {
  registries: Registry[];
  featuredRegistries?: Registry[];
};

export const RegistriesPageContent: React.FC<RegistriesPageContentProps> = ({
  registries,
  featuredRegistries = [],
}) => {
  const [view, setView] = useQueryState("view", { defaultValue: "registries" });

  return (
    <div className="w-full mt-10">
      <div className="flex flex-none items-center gap-2 mb-6">
        <Button
          variant="ghost"
          onClick={() => setView("registries")}
          className={cn(
            "rounded-none border-b-2 border-transparent hover:bg-transparent px-2 pb-2 pt-1 font-medium text-muted-foreground hover:text-foreground",
            view === "registries" && "border-primary text-foreground"
          )}
        >
          Registries
        </Button>
        <Button
          variant="ghost"
          onClick={() => setView("changes")}
          className={cn(
            "rounded-none border-b-2 border-transparent hover:bg-transparent px-2 pb-2 pt-1 font-medium text-muted-foreground hover:text-foreground",
            view === "changes" && "border-primary text-foreground"
          )}
        >
          Latest Changes
        </Button>
        <Button
          variant="ghost"
          onClick={() => setView("activity")}
          className={cn(
            "rounded-none border-b-2 border-transparent hover:bg-transparent px-2 pb-2 pt-1 font-medium text-muted-foreground hover:text-foreground",
            view === "activity" && "border-primary text-foreground"
          )}
        >
          Activity
        </Button>
      </div>

      {view === "registries" && (
        <RegistriesList
          registries={registries}
          featuredRegistries={featuredRegistries}
        />
      )}
      {view === "changes" && <LatestChangesList registries={registries} />}
      {view === "activity" && <ActivityGraph registries={registries} />}
    </div>
  );
};
