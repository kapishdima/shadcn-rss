import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { Copy, Download, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Registry } from "@/types";
import { copyRssUrls, downloadOpml } from "@/lib/export-utils";

interface SelectionBarProps {
  selectedRegistries: Registry[];
  onClear: () => void;
}

export const SelectionBar: React.FC<SelectionBarProps> = ({
  selectedRegistries,
  onClear,
}) => {
  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <AnimatePresence>
        {selectedRegistries.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
            className="flex items-center gap-3 bg-background/80 backdrop-blur-md border border-border shadow-lg rounded-full pl-5 pr-2 py-2 pointer-events-auto ring-1 ring-black/5"
          >
            <div className="text-sm font-medium text-foreground/90">
              {selectedRegistries.length} selected
            </div>
            <div className="h-4 w-px bg-border mx-1" />
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 rounded-full px-3 text-xs font-medium"
                onClick={() => downloadOpml(selectedRegistries)}
              >
                <Download className="mr-2 size-3.5" />
                Export OPML
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-8 w-8 rounded-full ml-1 hover:bg-muted text-muted-foreground hover:text-foreground"
                onClick={onClear}
                title="Clear selection"
              >
                <X className="size-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
