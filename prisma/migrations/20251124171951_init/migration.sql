/*
  Warnings:

  - You are about to drop the column `shopifyShop` on the `account` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "account" DROP COLUMN "shopifyShop",
ADD COLUMN     "shopifyUserEmail" TEXT,
ADD COLUMN     "shopifyUserId" TEXT;
