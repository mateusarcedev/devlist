/*
  Warnings:

  - Added the required column `userId` to the `suggestions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "suggestions" ADD COLUMN     "userId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("githubId") ON DELETE RESTRICT ON UPDATE CASCADE;
