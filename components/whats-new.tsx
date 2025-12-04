"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Play, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DISMISS_STORAGE_KEY = "whats-new-dismissed";
const VIDEO_PATH = "/updates/shadcnrssupdate3.mp4";

interface WhatsNewProps {
  title?: string;
  className?: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
}

export function WhatsNew({
  title = "What's New",
  className,
  position = "bottom-left",
}: WhatsNewProps) {
  const [isDismissed, setIsDismissed] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setIsMounted(true);
    // Check if user has dismissed this before
    const dismissed = localStorage.getItem(DISMISS_STORAGE_KEY);
    setIsDismissed(dismissed === "true");
  }, []);

  useEffect(() => {
    // Auto-play video when dialog opens
    if (isOpen && videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay may fail, that's okay
      });
    } else if (!isOpen && videoRef.current) {
      // Pause and reset video when dialog closes
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, [isOpen]);

  const handleDismiss = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsDismissed(true);
    localStorage.setItem(DISMISS_STORAGE_KEY, "true");
    setIsOpen(false);
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const positionClasses = {
    "bottom-right": "bottom-4 right-4 md:bottom-6 md:right-6",
    "bottom-left": "bottom-4 left-4 md:bottom-6 md:left-6",
    "top-right": "top-4 right-4 md:top-6 md:right-6",
    "top-left": "top-4 left-4 md:top-6 md:left-6",
  };

  // Don't render until mounted to avoid hydration mismatch
  if (!isMounted || isDismissed) {
    return null;
  }

  return (
    <>
      {/* Corner Widget */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
          className={cn("fixed z-50", positionClasses[position], className)}
        >
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
            onClick={handleOpen}
            className="group relative flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-3 shadow-lg hover:shadow-xl transition-all duration-200 border border-primary/20"
            aria-label="View what's new"
          >
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [1, 0.7, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: [0.42, 0, 0.58, 1],
              }}
              className="relative z-10"
            >
              <Sparkles className="h-4 w-4" />
            </motion.div>
            <span className="text-sm font-medium hidden sm:inline">
              {title}
            </span>
            <Play className="h-4 w-4 sm:hidden" />
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleDismiss}
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-background border border-border shadow-sm hover:bg-destructive hover:text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Dismiss"
            >
              <X className="h-3 w-3" />
            </Button>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Fullscreen Video Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          className="w-screen sm:max-w-[80vw]"
          showCloseButton={true}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
            {/* Video Element */}
            <video
              autoPlay
              ref={videoRef}
              src={VIDEO_PATH}
              className="w-full h-full object-contain max-w-full max-h-full"
              onPlay={handlePlay}
              onPause={handlePause}
              onLoadedData={() => setIsLoaded(true)}
              onError={() => {
                setHasError(true);
                setIsLoaded(true);
              }}
              controls
              playsInline
              preload="auto"
              aria-label="What's new video"
            />

            {/* Loading State */}
            {!isLoaded && !hasError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black">
                <div className="size-12 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {/* Error State */}
            {hasError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black">
                <div className="text-center">
                  <p className="text-lg text-white mb-2">
                    Failed to load video
                  </p>
                  <p className="text-sm text-white/60">
                    Please try again later
                  </p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
