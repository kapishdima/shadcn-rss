"use client";

import React from "react";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "motion/react";
import { ExternalLink, CalendarDays, Sparkles } from "lucide-react";

import { Registry } from "@/types";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "./ui/dialog";

type RegistryUpdateProps = {
  registry: Registry;
};

export const RegistryUpdate: React.FC<RegistryUpdateProps> = ({ registry }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  if (!registry.updatedAt) return null;
  if (!registry.latestItems || registry.latestItems.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Badge
          variant="outline"
          className="bg-emerald-50/80 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60 cursor-pointer text-xs px-2.5 py-1 h-7 font-medium whitespace-nowrap hover:bg-emerald-100 dark:hover:bg-emerald-900/50 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-200 flex items-center gap-1.5 group"
          suppressHydrationWarning
        >
          <span className="size-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
          Updated{" "}
          {formatDistanceToNow(new Date(registry.updatedAt), {
            addSuffix: true,
          })}
        </Badge>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-hidden md:max-w-2xl w-full p-0 gap-0 border-muted-foreground/10 border-t-2 border-t-emerald-500/50 dark:border-t-emerald-400/50">
        <DialogHeader className="p-6 pb-4 mb-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div
              className="size-10 shrink-0 rounded-xl bg-muted/80 p-2 *:[svg]:size-full *:[svg]:fill-foreground ring-1 ring-border/50"
              dangerouslySetInnerHTML={{ __html: registry.logo }}
              suppressHydrationWarning
            />
            <div className="flex flex-col gap-0.5">
              <DialogTitle className="text-lg font-semibold tracking-tight">
                {registry.name}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="size-3.5" />
                Latest updates & releases
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Timeline content */}
        <div className="px-6 pb-6 pt-2 max-h-[calc(85vh-8rem)] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/30">
          <div className="relative">
            <AnimatePresence mode="wait">
              {isOpen && (
                <div className="space-y-0">
                  {registry.latestItems.map((item, index) => (
                    <motion.div
                      key={item.guid}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -12 }}
                      transition={{
                        duration: 0.25,
                        delay: index * 0.06,
                        ease: [0.25, 0.46, 0.45, 0.94],
                      }}
                      className="relative pl-6 pb-5 last:pb-0 group"
                    >
                      {/* Timeline line */}
                      <div className="absolute left-[5px] top-3 bottom-0 w-px bg-linear-to-b from-border via-border to-transparent group-last:hidden" />

                      {/* Timeline dot */}
                      <div className="absolute left-0 top-2.5 size-[11px] rounded-full bg-muted border-2 border-background ring-[3px] ring-muted-foreground/10 group-hover:ring-emerald-500/20 group-hover:bg-emerald-500 dark:group-hover:bg-emerald-400 transition-all duration-200" />

                      <Card className="p-4 border-muted-foreground/10 hover:border-muted-foreground/20 bg-card/50 hover:bg-card transition-all duration-200 hover:shadow-sm group/card">
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block group/link"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="font-semibold text-[15px] leading-snug group-hover/link:text-emerald-600 dark:group-hover/link:text-emerald-400 transition-colors flex-1">
                              {item.title}
                            </h3>
                            <ExternalLink className="size-4 mt-0.5 shrink-0 text-muted-foreground/40 group-hover/link:text-emerald-500 dark:group-hover/link:text-emerald-400 transition-colors" />
                          </div>

                          {item.description && (
                            <p className="text-sm text-muted-foreground mt-2 leading-relaxed line-clamp-2">
                              {item.description}
                            </p>
                          )}

                          <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground/70">
                            <CalendarDays className="size-3.5" />
                            <time
                              dateTime={item.pubDate}
                              suppressHydrationWarning
                            >
                              {formatDistanceToNow(new Date(item.pubDate), {
                                addSuffix: true,
                              })}
                            </time>
                            <span className="text-muted-foreground/30 mx-1">
                              •
                            </span>
                            <span suppressHydrationWarning>
                              {new Date(item.pubDate).toLocaleDateString(
                                undefined,
                                {
                                  month: "short",
                                  day: "numeric",
                                  year:
                                    new Date(item.pubDate).getFullYear() !==
                                    new Date().getFullYear()
                                      ? "numeric"
                                      : undefined,
                                }
                              )}
                            </span>
                          </div>
                        </a>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
