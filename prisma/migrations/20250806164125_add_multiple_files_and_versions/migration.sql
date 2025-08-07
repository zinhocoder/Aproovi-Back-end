-- AlterTable
ALTER TABLE "public"."Creative" ADD COLUMN     "arquivos" TEXT,
ADD COLUMN     "legenda" TEXT,
ADD COLUMN     "tipo" TEXT DEFAULT 'post',
ADD COLUMN     "versoes" TEXT;
