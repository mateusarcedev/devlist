/*
  Warnings:

  - You are about to drop the column `suggestedBy` on the `tools` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "tools" DROP CONSTRAINT "tools_suggestedBy_fkey";

-- AlterTable
ALTER TABLE "tools" DROP COLUMN "suggestedBy";
