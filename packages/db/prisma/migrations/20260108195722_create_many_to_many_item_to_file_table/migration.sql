/*
  Warnings:

  - You are about to drop the `registries_items_files` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `registry_item_diffs` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "registries_items_files" DROP CONSTRAINT "registries_items_files_item_id_fkey";

-- DropForeignKey
ALTER TABLE "registry_file_commits" DROP CONSTRAINT "registry_file_commits_file_id_fkey";

-- DropForeignKey
ALTER TABLE "registry_item_diffs" DROP CONSTRAINT "registry_item_diffs_item_id_fkey";

-- AlterTable
ALTER TABLE "registry_file_commits" ADD COLUMN     "diff" TEXT;

-- DropTable
DROP TABLE "registries_items_files";

-- DropTable
DROP TABLE "registry_item_diffs";

-- CreateTable
CREATE TABLE "registry_files" (
    "id" SERIAL NOT NULL,
    "registry_id" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "type" TEXT,

    CONSTRAINT "registry_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registry_item_files" (
    "id" SERIAL NOT NULL,
    "item_id" INTEGER NOT NULL,
    "file_id" INTEGER NOT NULL,

    CONSTRAINT "registry_item_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "registry_files_registry_id_path_key" ON "registry_files"("registry_id", "path");

-- CreateIndex
CREATE UNIQUE INDEX "registry_item_files_item_id_file_id_key" ON "registry_item_files"("item_id", "file_id");

-- AddForeignKey
ALTER TABLE "registry_files" ADD CONSTRAINT "registry_files_registry_id_fkey" FOREIGN KEY ("registry_id") REFERENCES "registries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registry_item_files" ADD CONSTRAINT "registry_item_files_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "registries_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registry_item_files" ADD CONSTRAINT "registry_item_files_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "registry_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registry_file_commits" ADD CONSTRAINT "registry_file_commits_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "registry_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;
