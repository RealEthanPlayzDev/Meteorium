import { MessageCreateOptions, MessagePayload, User, time, userMention } from "discord.js";
import { ModerationAction } from "@prisma/client";
import MeteoriumClient from "./client.js";
import MeteoriumEmbedBuilder from "./embedBuilder.js";

export type CaseData = {
    GlobalCaseId: number;
    CaseId: number;
    Action: ModerationAction;
    TargetUserId: string;
    ModeratorUserId: string;
    Active: boolean;
    RelatedCaseId: number;
    PublicLogMsgId: string;
    CreatedAt: Date;

    Reason: string;
    AttachmentProof: string;
    Duration: string;
    ModeratorNote: string;
    ModeratorAttachment: string;
    NotAppealable: boolean;
    Removed: boolean;
};

export default class MeteoriumDatabaseUtilities {
    public client: MeteoriumClient;

    public constructor(client: MeteoriumClient) {
        this.client = client;
    }

    public async getCaseData(guildId: string, caseId: number, historyTake?: number): Promise<CaseData | false> {
        // Get case
        const caseDb = await this.client.db.moderationCase.findUnique({
            where: { UniqueCaseIdPerGuild: { GuildId: guildId, CaseId: caseId } },
            include: { ModerationCaseHistory: { take: historyTake } },
        });
        if (!caseDb) return false;

        // Build a final data dictionary
        const finalData: CaseData = {
            GlobalCaseId: caseDb.GlobalCaseId,
            CaseId: caseDb.CaseId,
            Action: caseDb.Action,
            TargetUserId: caseDb.TargetUserId,
            ModeratorUserId: caseDb.ModeratorUserId,
            Active: caseDb.Active,
            RelatedCaseId: caseDb.RelatedCaseId,
            PublicLogMsgId: caseDb.PublicModLogMsgId,
            CreatedAt: caseDb.CreatedAt,

            Reason: caseDb.Reason,
            AttachmentProof: caseDb.AttachmentProof,
            Duration: caseDb.Duration,
            ModeratorNote: caseDb.ModeratorNote,
            ModeratorAttachment: caseDb.ModeratorAttachment,
            NotAppealable: caseDb.NotAppealable,
            Removed: false,
        };

        // Apply edits
        for (const edit of caseDb.ModerationCaseHistory) {
            finalData.Reason = edit.Reason != null ? edit.Reason : finalData.Reason;
            finalData.AttachmentProof = edit.AttachmentProof != null ? edit.AttachmentProof : finalData.AttachmentProof;
            finalData.Duration = edit.Duration != null ? edit.Duration : finalData.Duration;
            finalData.ModeratorNote = edit.ModeratorNote != null ? edit.ModeratorNote : finalData.ModeratorNote;
            finalData.ModeratorAttachment =
                edit.ModeratorAttachment != null ? edit.ModeratorAttachment : finalData.ModeratorAttachment;
            finalData.NotAppealable = edit.NotAppealable != null ? edit.NotAppealable : finalData.NotAppealable;
            finalData.Removed = edit.Removed != null ? edit.Removed : finalData.Removed;
        }

        return finalData;
    }

    public async getCasesWithLatestHistory(
        guildId: string,
        targetUserId?: string,
        take?: number,
        skip?: number,
    ): Promise<Array<CaseData>> {
        // Original cases
        const cases = await this.client.db.moderationCase.findMany({
            where: { GuildId: guildId, TargetUserId: targetUserId },
            orderBy: { CaseId: "desc" },
            take: take,
            skip: skip,
        });

        const latestCases: Array<CaseData> = [];
        for (const caseDataOriginal of cases) {
            const latestCaseData = await this.getCaseData(guildId, caseDataOriginal.CaseId);
            if (!latestCaseData) throw new Error(`could not get case data for case ${caseDataOriginal.CaseId}`);
            latestCases.push(latestCaseData);
        }

        return latestCases;
    }

    public async generateCaseEmbedFromData(
        caseData: CaseData,
        requester?: User,
        full?: boolean,
        inclRequester?: boolean,
    ): Promise<MeteoriumEmbedBuilder> {
        // Get user datas
        const modUser = await this.client.users.fetch(caseData.ModeratorUserId).catch(() => null);
        const targetUser = await this.client.users.fetch(caseData.TargetUserId).catch(() => null);

        const embed = new MeteoriumEmbedBuilder(requester);

        // Set the author field
        embed.setAuthor({
            name: `Case #${caseData.CaseId} | ${caseData.Action.toLowerCase()} | ${targetUser != null ? `${targetUser.username} (${targetUser.id})` : caseData.TargetUserId}`,
            iconURL: targetUser != null ? targetUser.displayAvatarURL({ extension: "png", size: 256 }) : undefined,
        });

        // Set the attachment proof if any exist
        embed.setThumbnail(caseData.AttachmentProof == "" ? null : caseData.AttachmentProof);

        // Include requester?
        if (inclRequester && requester)
            embed.addFields([
                { name: "Requester", value: `${userMention(requester.id)} (${requester.username} - ${requester.id})` },
            ]);

        // Add target and moderator fields
        embed.addFields([
            {
                name: "Moderator",
                value: `${userMention(caseData.ModeratorUserId)} (${modUser != null ? `${modUser.username} - ${modUser.id}` : caseData.ModeratorUserId})`,
            },
            {
                name: "Target",
                value: `${userMention(caseData.TargetUserId)} (${targetUser != null ? `${targetUser.username} - ${targetUser.id}` : caseData.TargetUserId})`,
            },
        ]);

        // Reason
        embed.addFields([{ name: "Reason", value: caseData.Reason }]);

        // Duration
        if (caseData.Action == ModerationAction.Mute || caseData.Action == ModerationAction.TempBan)
            embed.addFields([{ name: "Duration", value: caseData.Duration }]);

        // Appealable
        if (caseData.Action == ModerationAction.Ban)
            embed.addFields([{ name: "Appealable", value: caseData.NotAppealable ? "No" : "Yes" }]);

        // Active ban and related appeal case id
        if (caseData.Action == ModerationAction.Ban && full)
            embed.addFields([
                { name: "Active ban", value: caseData.Active ? "Yes" : "No" },
                {
                    name: "Appeal case id",
                    value: caseData.RelatedCaseId != -1 ? caseData.RelatedCaseId.toString() : "N/A",
                },
            ]);

        // Full data
        if (full) {
            embed.addFields([
                { name: "Moderator note", value: caseData.ModeratorNote == "" ? "N/A" : caseData.ModeratorNote },
                { name: "Removed", value: caseData.Removed ? "Yes" : "No" },
            ]);
            embed.setImage(caseData.ModeratorAttachment == "" ? null : caseData.ModeratorAttachment);
        }

        // Created at
        embed.addFields([
            { name: "Created at", value: `${time(caseData.CreatedAt, "F")} (${time(caseData.CreatedAt, "R")})` },
        ]);

        return embed;
    }

    public async generateCaseEmbedFromCaseId(
        guildId: string,
        caseId: number,
        requester?: User,
        full?: boolean,
        historyTake?: number,
        inclRequester?: boolean,
    ): Promise<MeteoriumEmbedBuilder | false> {
        const caseData = await this.getCaseData(guildId, caseId, historyTake);
        if (!caseData) return false;
        return await this.generateCaseEmbedFromData(caseData, requester, full, inclRequester);
    }

    public async sendGuildLog(guildId: string, reply: string | MessagePayload | MessageCreateOptions) {
        const guildSettings = await this.client.db.guild.findUnique({ where: { GuildId: guildId } });
        if (!guildSettings) return;
        if (guildSettings.LoggingChannelId == "") return;

        const channel = await this.client.channels.fetch(guildSettings.LoggingChannelId).catch(() => null);
        if (!channel || !channel.isTextBased()) return;

        return await channel.send(reply);
    }
}
