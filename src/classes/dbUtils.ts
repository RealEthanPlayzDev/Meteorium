import MeteoriumClient from "./client.js";
import { ModerationAction } from "@prisma/client";

export type CaseData = {
    GlobalCaseId: number;
    CaseId: number;
    Action: ModerationAction;
    TargetUserId: string;
    ModeratorUserId: string;
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
        const finalData = {
            GlobalCaseId: caseDb.GlobalCaseId,
            CaseId: caseDb.CaseId,
            Action: caseDb.Action,
            TargetUserId: caseDb.TargetUserId,
            ModeratorUserId: caseDb.ModeratorUserId,
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
}
