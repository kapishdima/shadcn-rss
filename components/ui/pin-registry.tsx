import React from "react";
import { Pin } from "lucide-react";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

type PinRegistryProps = {
  togglePin: () => Promise<void>;
  isPinned: boolean;
};

export const PinRegistry: React.FC<PinRegistryProps> = ({
  togglePin,
  isPinned,
}) => {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className={cn(
        "h-8 w-8 rounded-full text-muted-foreground hover:text-amber-500",
        isPinned && "text-amber-500 hover:text-amber-600"
      )}
      onClick={togglePin}
      title={isPinned ? "Unpin registry" : "Pin registry"}
    >
      <Pin className={cn("size-4 -rotate-45", isPinned && "fill-current")} />
    </Button>
  );
};
