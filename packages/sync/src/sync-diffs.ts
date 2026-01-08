import { prisma } from "@shadcnrss/db";
import { gh } from "@shadcnrss/gh";
import { progress } from "@shadcnrss/tui";

import { getRepoOwnerAndName } from "./github.js";

/**
 * Fetch diff for a specific commit and file from GitHub
 */
const fetchFileDiff = async (
  owner: string,
  repo: string,
  commitSha: string,
  filePath: string
): Promise<string | null> => {
  try {
    const commit = await gh.rest.repos.getCommit({
      owner,
      repo,
      ref: commitSha,
    });

    const file = commit.data.files?.find((f) => f.filename === filePath);

    return file?.patch ?? null;
  } catch (error) {
    console.error(`Failed to fetch diff for ${filePath} at ${commitSha}`);
    return null;
  }
};

/**
 * Sync diffs for all file-commit pairs that don't have diffs yet
 */
export async function syncDiffs() {
  const spinner = progress();
  spinner.start("Starting diffs sync...");

  const registries = await prisma.registry.findMany({
    where: { repo: { not: null } },
  });

  for (const registry of registries) {
    if (!registry.repo) continue;

    const repo = getRepoOwnerAndName(registry.repo);
    if (!repo) continue;

    // Find file-commits without diffs
    const fileCommitsWithoutDiff = await prisma.registryFileCommit.findMany({
      where: {
        diff: null,
        file: { registryId: registry.id },
      },
      include: {
        file: true,
        commit: true,
      },
    });

    spinner.step(
      `Found ${fileCommitsWithoutDiff.length} diffs to fetch for ${registry.name}`
    );

    for (const fileCommit of fileCommitsWithoutDiff) {
      const diff = await fetchFileDiff(
        repo.owner,
        repo.name,
        fileCommit.commit.commitSha,
        fileCommit.file.path
      );

      if (diff) {
        await prisma.registryFileCommit.update({
          where: { id: fileCommit.id },
          data: { diff },
        });
      }
    }

    spinner.step(`Synced diffs for ${registry.name}`);
  }

  spinner.succeed("Diffs sync completed.");
  return true;
}

/**
 * Get diffs for a specific registry item (for display to users)
 */
export async function getItemDiffs(itemId: number) {
  const itemFiles = await prisma.registryItemFile.findMany({
    where: { itemId },
    include: {
      file: {
        include: {
          commits: {
            include: { commit: true },
            where: { diff: { not: null } },
            orderBy: { commit: { date: "desc" } },
          },
        },
      },
    },
  });

  return itemFiles.map((itemFile) => ({
    path: itemFile.file.path,
    commits: itemFile.file.commits.map((fc) => ({
      sha: fc.commit.commitSha,
      message: fc.commit.message,
      date: fc.commit.date,
      url: fc.commit.url,
      diff: fc.diff,
    })),
  }));
}
