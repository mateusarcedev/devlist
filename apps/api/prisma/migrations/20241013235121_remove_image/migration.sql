/*
  Warnings:

  - You are about to drop the column `iconUrl` on the `suggestions` table. All the data in the column will be lost.
  - You are about to drop the column `iconUrl` on the `tools` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "suggestions" DROP COLUMN "iconUrl";

-- AlterTable
ALTER TABLE "tools" DROP COLUMN "iconUrl";
