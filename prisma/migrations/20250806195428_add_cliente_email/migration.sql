/*
  Warnings:

  - Added the required column `clienteEmail` to the `Empresa` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
-- Primeiro adiciona a coluna como nullable
ALTER TABLE "public"."Empresa" ADD COLUMN "clienteEmail" TEXT;

-- Atualiza registros existentes com um valor padrão
UPDATE "public"."Empresa" SET "clienteEmail" = 'cliente@' || LOWER(REPLACE("nome", ' ', '')) || '.com' WHERE "clienteEmail" IS NULL;

-- Agora torna a coluna NOT NULL
ALTER TABLE "public"."Empresa" ALTER COLUMN "clienteEmail" SET NOT NULL;
