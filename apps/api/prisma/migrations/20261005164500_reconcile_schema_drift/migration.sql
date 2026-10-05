-- Reconcile historical migration drift with the current Prisma schema.
--
-- This migration intentionally does not rewrite older migrations. It rolls
-- forward databases that were created from the existing migration history.

-- Refresh tokens were added to the Prisma schema/auth flow without a
-- corresponding migration. Create the table when it is still missing.
CREATE TABLE IF NOT EXISTS "refresh_tokens" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "refresh_tokens_tokenHash_key"
ON "refresh_tokens"("tokenHash");

-- Add the FK separately so databases where refresh_tokens was created
-- manually can still be reconciled safely.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'refresh_tokens_userId_fkey'
          AND conrelid = 'refresh_tokens'::regclass
    ) THEN
        ALTER TABLE "refresh_tokens"
        ADD CONSTRAINT "refresh_tokens_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "users"("githubId")
        ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- The Prisma schema has always intended one favorite per user/tool pair, but
-- the historical migrations never created the unique index. Remove duplicate
-- legacy rows deterministically before enforcing the invariant.
DELETE FROM "favorites" AS duplicate
USING "favorites" AS keeper
WHERE duplicate."userId" = keeper."userId"
  AND duplicate."toolId" = keeper."toolId"
  AND duplicate."id" > keeper."id";

CREATE UNIQUE INDEX IF NOT EXISTS "favorites_userId_toolId_key"
ON "favorites"("userId", "toolId");

-- categoryID was renamed to categoryId in 2026, but the FK constraint kept
-- its old generated name. Rename it when present; if a database is missing
-- the FK entirely, recreate it with the canonical name.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'tools_categoryId_fkey'
          AND conrelid = 'tools'::regclass
    ) THEN
        IF EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE conname = 'tools_categoryID_fkey'
              AND conrelid = 'tools'::regclass
        ) THEN
            ALTER TABLE "tools"
            RENAME CONSTRAINT "tools_categoryID_fkey" TO "tools_categoryId_fkey";
        ELSE
            ALTER TABLE "tools"
            ADD CONSTRAINT "tools_categoryId_fkey"
            FOREIGN KEY ("categoryId") REFERENCES "categories"("id")
            ON DELETE RESTRICT ON UPDATE CASCADE;
        END IF;
    END IF;
END $$;
