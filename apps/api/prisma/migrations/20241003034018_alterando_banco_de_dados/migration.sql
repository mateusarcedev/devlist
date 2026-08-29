/*
  Warnings:

  - A unique constraint covering the columns `[link]` on the table `tools` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `toolId` to the `suggestions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "suggestions" ADD COLUMN     "toolId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "tools" ADD COLUMN     "suggestedBy" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "tools_link_key" ON "tools"("link");

-- AddForeignKey
ALTER TABLE "tools" ADD CONSTRAINT "tools_suggestedBy_fkey" FOREIGN KEY ("suggestedBy") REFERENCES "users"("githubId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "tools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
