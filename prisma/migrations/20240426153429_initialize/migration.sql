-- CreateEnum
CREATE TYPE "ModerationAction" AS ENUM ('Ban', 'TempBan', 'Kick', 'Mute', 'Warn', 'Unban');

-- CreateEnum
CREATE TYPE "GuildFeatures" AS ENUM ('Moderation', 'UserVerification', 'Tags', 'Music', 'DiscordInfo', 'HolodexAPI', 'MojangAPI', 'RobloxAPI');

-- CreateTable
CREATE TABLE "Guild" (
    "GuildId" TEXT NOT NULL,
    "EnforceSayInExecutor" BOOLEAN NOT NULL DEFAULT false,
    "JoinLeaveLogChannelId" TEXT NOT NULL DEFAULT '',
    "PublicModLogChannelId" TEXT NOT NULL DEFAULT '',
    "LoggingChannelId" TEXT NOT NULL DEFAULT '',
    "BanAppealLink" TEXT NOT NULL DEFAULT '',
    "EnabledGuildFeatures" "GuildFeatures"[]
);

-- CreateTable
CREATE TABLE "ModerationCase" (
    "GlobalCaseId" SERIAL NOT NULL,
    "GuildId" TEXT NOT NULL,
    "CaseId" INTEGER NOT NULL,
    "Action" "ModerationAction" NOT NULL,
    "TargetUserId" TEXT NOT NULL,
    "ModeratorUserId" TEXT NOT NULL,
    "Reason" TEXT NOT NULL,
    "AttachmentProof" TEXT NOT NULL DEFAULT '',
    "Duration" TEXT NOT NULL DEFAULT '0',
    "ModeratorNote" TEXT NOT NULL DEFAULT '',
    "ModeratorAttachment" TEXT NOT NULL DEFAULT '',
    "NotAppealable" BOOLEAN NOT NULL DEFAULT false,
    "Active" BOOLEAN NOT NULL DEFAULT true,
    "RelatedCaseId" INTEGER NOT NULL DEFAULT -1,
    "PublicModLogMsgId" TEXT NOT NULL DEFAULT '',
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModerationCase_pkey" PRIMARY KEY ("GlobalCaseId")
);

-- CreateTable
CREATE TABLE "ModerationCaseHistory" (
    "ModerationCaseHistoryId" SERIAL NOT NULL,
    "GlobalCaseId" INTEGER NOT NULL,
    "EditedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "EditorUserId" TEXT NOT NULL,
    "Reason" TEXT,
    "AttachmentProof" TEXT,
    "Duration" TEXT,
    "ModeratorNote" TEXT,
    "ModeratorAttachment" TEXT,
    "NotAppealable" BOOLEAN,
    "Removed" BOOLEAN,

    CONSTRAINT "ModerationCaseHistory_pkey" PRIMARY KEY ("ModerationCaseHistoryId")
);

-- CreateTable
CREATE TABLE "ActiveTempBans" (
    "ActiveTempBanId" SERIAL NOT NULL,
    "GlobalCaseId" INTEGER NOT NULL,

    CONSTRAINT "ActiveTempBans_pkey" PRIMARY KEY ("ActiveTempBanId")
);

-- CreateTable
CREATE TABLE "Tag" (
    "GlobalTagId" SERIAL NOT NULL,
    "GuildId" TEXT NOT NULL,
    "TagName" TEXT NOT NULL,
    "Content" TEXT NOT NULL,
    "Attachment" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("GlobalTagId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Guild_GuildId_key" ON "Guild"("GuildId");

-- CreateIndex
CREATE UNIQUE INDEX "ModerationCase_GuildId_CaseId_key" ON "ModerationCase"("GuildId", "CaseId");

-- CreateIndex
CREATE UNIQUE INDEX "ActiveTempBans_GlobalCaseId_key" ON "ActiveTempBans"("GlobalCaseId");

-- AddForeignKey
ALTER TABLE "ModerationCase" ADD CONSTRAINT "ModerationCase_GuildId_fkey" FOREIGN KEY ("GuildId") REFERENCES "Guild"("GuildId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationCaseHistory" ADD CONSTRAINT "ModerationCaseHistory_GlobalCaseId_fkey" FOREIGN KEY ("GlobalCaseId") REFERENCES "ModerationCase"("GlobalCaseId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveTempBans" ADD CONSTRAINT "ActiveTempBans_GlobalCaseId_fkey" FOREIGN KEY ("GlobalCaseId") REFERENCES "ModerationCase"("GlobalCaseId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_GuildId_fkey" FOREIGN KEY ("GuildId") REFERENCES "Guild"("GuildId") ON DELETE CASCADE ON UPDATE CASCADE;
