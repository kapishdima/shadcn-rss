import { prisma, Registry } from "@shadcnrss/db";
import { progress } from "@shadcnrss/tui";

import {
  fetchRepoInfo,
  fetchItemCommits,
  getRepoOwnerAndName,
} from "./github.js";

const syncRepoInfo = async (registry: Registry) => {
  if (!registry.repo) return null;

  const repoInfo = await fetchRepoInfo(registry.repo);

  if (!repoInfo) return null;

  return prisma.registryRepo.upsert({
    where: { registryId: registry.id },
    create: {
      registryId: registry.id,
      ...repoInfo,
    },
    update: repoInfo,
  });
};

const syncFileCommits = async (registry: Registry) => {
  if (!registry.repo) return;

  const repo = getRepoOwnerAndName(registry.repo);
  if (!repo) return;

  const files = await prisma.registryFile.findMany({
    where: { registryId: registry.id },
  });

  for (const file of files) {
    const commits = await fetchItemCommits(repo.owner, repo.name, file.path);

    for (const commitData of commits) {
      // Upsert the commit
      const commit = await prisma.registryCommit.upsert({
        where: { commitSha: commitData.commitSha },
        create: {
          commitSha: commitData.commitSha,
          message: commitData.message,
          url: commitData.url,
          date: commitData.date,
        },
        update: {
          message: commitData.message,
          url: commitData.url,
          date: commitData.date,
        },
      });

      // Link commit to file
      await prisma.registryFileCommit.upsert({
        where: {
          fileId_commitId: { fileId: file.id, commitId: commit.id },
        },
        create: {
          fileId: file.id,
          commitId: commit.id,
        },
        update: {},
      });
    }
  }
};

export async function syncGithubData() {
  const spinner = progress();
  spinner.start("Starting GitHub data sync...");

  const registries = await prisma.registry.findMany();

  for (const registry of registries) {
    // Sync repo metadata (stars, forks, etc.)
    await syncRepoInfo(registry);
    spinner.step(`Synced repo info: ${registry.name}`);

    // Sync commits for all files
    await syncFileCommits(registry);
    spinner.step(`Synced commits: ${registry.name}`);
  }

  spinner.succeed("GitHub data sync completed.");
  return true;
}
