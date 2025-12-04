import "server-only";

import { Registry } from "@/types";
import { getLocalStoragePins } from "@/lib/pins-client-utils";
import { getPinnedRegistriesForUser } from "@/lib/pins";
import { getRegistries } from "@/lib/registies";
import { getServerSession } from "./auth-server";

/**
 * Sort registries by update date (most recent first), then by name
 */
function sortRegistriesByDate(registries: Registry[]): Registry[] {
  return [...registries].sort((a, b) => {
    if (!a.updatedAt && !b.updatedAt) return a.name.localeCompare(b.name);
    if (!a.updatedAt) return 1;
    if (!b.updatedAt) return -1;

    const timeDiff = b.updatedAt.getTime() - a.updatedAt.getTime();
    if (timeDiff !== 0) return timeDiff;

    return a.name.localeCompare(b.name);
  });
}

const getPinnedRegistries = async (): Promise<Registry[]> => {
  const session = await getServerSession();

  if (session?.user.id) {
    return getPinnedRegistriesForUser(session.user.id);
  }

  return getLocalStoragePins();
};

/**
 * Get all registries with RSS data, sorted by update date
 */
export async function collectRssFeed(): Promise<Registry[]> {
  const registries = await getRegistries();

  return sortRegistriesByDate(registries);
}

export async function getUnpinnedRegistries(): Promise<Registry[]> {
  const registries = await getRegistries();

  return sortRegistriesByDate(registries);
}
