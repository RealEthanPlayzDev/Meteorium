import MeteoriumClient from "./client.js";

export default class MeteoriumDatabaseUtilities {
    public client: MeteoriumClient;

    public constructor(client: MeteoriumClient) {
        this.client = client;
    }

    public async getCaseData(guildId: string, caseId: number, historyTake?: number) {
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
}
