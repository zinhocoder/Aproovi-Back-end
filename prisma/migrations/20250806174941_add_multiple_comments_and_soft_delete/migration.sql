-- AlterTable
ALTER TABLE "public"."Creative" ADD COLUMN     "comentarios" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
