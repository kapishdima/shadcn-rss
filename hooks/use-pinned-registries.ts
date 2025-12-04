"use client";

import { useCallback, useState } from "react";
import {
  getPins,
  pinRegistry as apiPinRegistry,
  unpinRegistry as apiUnpinRegistry,
} from "@/lib/api/pins";
import { Registry } from "@/types";

export function usePinnedRegistries() {
  const [isLoading, setIsLoading] = useState(true);

  const [pins, setPins] = useState<Registry[]>([]);

  const loadPins = async () => {
    setIsLoading(true);
    const pins = await getPins();
    console.log("loaded pins", pins);
    setPins(pins);
    setIsLoading(false);
  };

  const isPinned = useCallback(
    (name: string) => {
      if (!pins?.length) return false;
      return pins.some((pin) => pin.name === name);
    },
    [pins]
  );

  const pinRegistryFn = async (registry: Registry) => {
    setPins((prev) => {
      console.log("prev", prev);
      if (prev.some((pin) => pin.name === registry.name)) return prev;
      return [...prev, registry];
    });

    await apiPinRegistry(registry);
  };

  const unpinRegistryFn = async (registry: Registry) => {
    setPins((prev) => prev.filter((pin) => pin.name !== registry.name));

    await apiUnpinRegistry(registry);
  };

  const togglePin = async (registry: Registry) => {
    if (isPinned(registry.name)) {
      await unpinRegistryFn(registry);
    } else {
      await pinRegistryFn(registry);
    }
  };

  return {
    pins,
    isPinned,
    togglePin,
    loadPins,
    isLoading,
    pinRegistry: pinRegistryFn,
    unpinRegistry: unpinRegistryFn,
  };
}
