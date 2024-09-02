-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('Waiting', 'Approved', 'Rejected', 'Revoked');

-- AlterTable
ALTER TABLE "Guild" ADD COLUMN     "VerifyAttachEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "VerifyDetailEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "VerifyTempPaused" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "VerifyUnverifiedRoleId" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "VerifyVerifiedRoleId" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "UserVerificationData" (
    "GuildId" TEXT NOT NULL,
    "UserId" TEXT NOT NULL,
    "Banned" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "UserVerificationHistory" (
    "VerificationHistoryId" SERIAL NOT NULL,
    "GuildId" TEXT NOT NULL,
    "UserId" TEXT NOT NULL,
    "Status" "VerificationStatus" NOT NULL DEFAULT 'Waiting',
    "CheckerUserId" TEXT NOT NULL DEFAULT '',
    "CheckerNote" TEXT NOT NULL DEFAULT '',
    "Detail" TEXT NOT NULL DEFAULT '',
    "Attachment" TEXT NOT NULL DEFAULT '',
    "RejectReason" TEXT NOT NULL DEFAULT '',
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserVerificationHistory_pkey" PRIMARY KEY ("VerificationHistoryId")
);

-- CreateTable
CREATE TABLE "UserVerificationAttachment" (
    "GuildId" TEXT NOT NULL,
    "UserId" TEXT NOT NULL,
    "Attachment" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "UserVerificationData_GuildId_UserId_key" ON "UserVerificationData"("GuildId", "UserId");

-- CreateIndex
CREATE UNIQUE INDEX "UserVerificationAttachment_GuildId_UserId_key" ON "UserVerificationAttachment"("GuildId", "UserId");

-- AddForeignKey
ALTER TABLE "UserVerificationData" ADD CONSTRAINT "UserVerificationData_GuildId_fkey" FOREIGN KEY ("GuildId") REFERENCES "Guild"("GuildId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserVerificationHistory" ADD CONSTRAINT "UserVerificationHistory_GuildId_UserId_fkey" FOREIGN KEY ("GuildId", "UserId") REFERENCES "UserVerificationData"("GuildId", "UserId") ON DELETE CASCADE ON UPDATE CASCADE;
