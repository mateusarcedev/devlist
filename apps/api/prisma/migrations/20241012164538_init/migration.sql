-- DropForeignKey
ALTER TABLE "suggestions" DROP CONSTRAINT "suggestions_toolId_fkey";

-- AlterTable
ALTER TABLE "suggestions" ALTER COLUMN "toolId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "tools"("id") ON DELETE SET NULL ON UPDATE CASCADE;
