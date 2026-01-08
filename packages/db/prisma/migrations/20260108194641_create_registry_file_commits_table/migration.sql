/*
  Warnings:

  - You are about to drop the column `registry_id` on the `registries_items_files` table. All the data in the column will be lost.
  - You are about to drop the `registry_item_commits` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[item_id,path]` on the table `registries_items_files` will be added. If there are existing duplicate values, this will fail.
  - Made the column `registry_id` on table `registries_items` required. This step will fail if there are existing NULL values in that column.
  - Made the column `item_id` on table `registries_items_files` required. This step will fail if there are existing NULL values in that column.
  - Made the column `path` on table `registries_items_files` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "registries_items" DROP CONSTRAINT "registries_items_registry_id_fkey";

-- DropForeignKey
ALTER TABLE "registries_items_files" DROP CONSTRAINT "registries_items_files_item_id_fkey";

-- DropForeignKey
ALTER TABLE "registries_items_files" DROP CONSTRAINT "registries_items_files_registry_id_fkey";

-- DropForeignKey
ALTER TABLE "registry_item_commits" DROP CONSTRAINT "registry_item_commits_item_id_fkey";

-- DropIndex
DROP INDEX "registries_items_files_registry_id_path_key";

-- AlterTable
ALTER TABLE "registries_items" ALTER COLUMN "registry_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "registries_items_files" DROP COLUMN "registry_id",
ALTER COLUMN "item_id" SET NOT NULL,
ALTER COLUMN "path" SET NOT NULL;

-- DropTable
DROP TABLE "registry_item_commits";

-- CreateTable
CREATE TABLE "registry_commits" (
    "id" SERIAL NOT NULL,
    "commit_sha" TEXT NOT NULL,
    "message" TEXT,
    "url" TEXT,
    "date" TIMESTAMP(3),

    CONSTRAINT "registry_commits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registry_file_commits" (
    "id" SERIAL NOT NULL,
    "file_id" INTEGER NOT NULL,
    "commit_id" INTEGER NOT NULL,

    CONSTRAINT "registry_file_commits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "registry_commits_commit_sha_key" ON "registry_commits"("commit_sha");

-- CreateIndex
CREATE UNIQUE INDEX "registry_file_commits_file_id_commit_id_key" ON "registry_file_commits"("file_id", "commit_id");

-- CreateIndex
CREATE UNIQUE INDEX "registries_items_files_item_id_path_key" ON "registries_items_files"("item_id", "path");

-- AddForeignKey
ALTER TABLE "registries_items" ADD CONSTRAINT "registries_items_registry_id_fkey" FOREIGN KEY ("registry_id") REFERENCES "registries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registries_items_files" ADD CONSTRAINT "registries_items_files_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "registries_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registry_file_commits" ADD CONSTRAINT "registry_file_commits_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "registries_items_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registry_file_commits" ADD CONSTRAINT "registry_file_commits_commit_id_fkey" FOREIGN KEY ("commit_id") REFERENCES "registry_commits"("id") ON DELETE CASCADE ON UPDATE CASCADE;
