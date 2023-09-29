/*
  Warnings:

  - Added the required column `updateAt` to the `PasswordReset` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `PasswordReset` ADD COLUMN `updateAt` DATETIME(3) NOT NULL;
