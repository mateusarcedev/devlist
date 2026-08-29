/*
  Warnings:

  - You are about to drop the column `userId` on the `suggestions` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "suggestions" DROP CONSTRAINT "suggestions_userId_fkey";

-- AlterTable
ALTER TABLE "suggestions" DROP COLUMN "userId";
