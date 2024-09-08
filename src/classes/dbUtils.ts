import {
    Interaction,
    MessageCreateOptions,
    MessagePayload,
    User,
    ModalBuilder,
    ActionRowBuilder,
    TextInputBuilder,
    time,
    userMention,
    TextInputStyle,
    GuildMember,
    ButtonBuilder,
    ComponentBuilder,
    ButtonStyle,
    Collection,
} from "discord.js";
import { GuildFeatures, ModerationAction, ModerationCase, VerificationStatus } from "@prisma/client";
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

export type NewCaseData = {
    Action: ModerationAction;
    GuildId: string;
    TargetUserId: string;
    ModeratorUserId: string;
    RelatedCaseId?: number;
    Reason: string;
    AttachmentProof?: string;
    Duration?: string;
    ModeratorNote?: string;
    ModeratorAttachment?: string;
    NotAppealable?: boolean;
};

export default class MeteoriumDatabaseUtilities {
    public client: MeteoriumClient;
    public modPingData: Collection<
        string,
        {
            amount: number;
            repeated: number;
            channelId: string;
            callMessageIds: Array<string>;
        }
    >;

    public constructor(client: MeteoriumClient) {
        this.client = client;
        this.modPingData = new Collection();
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
        embed.setImage(caseData.AttachmentProof == "" ? null : caseData.AttachmentProof);

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
            if (caseData.ModeratorAttachment != "") {
                embed.setImage(caseData.ModeratorAttachment == "" ? null : caseData.ModeratorAttachment);
                embed.setThumbnail(caseData.AttachmentProof == "" ? null : caseData.AttachmentProof);
            }
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

    public async sendGuildPubLog(guildId: string, reply: string | MessagePayload | MessageCreateOptions) {
        const guildSettings = await this.client.db.guild.findUnique({ where: { GuildId: guildId } });
        if (!guildSettings) return;
        if (guildSettings.LoggingChannelId == "") return;

        const channel = await this.client.channels.fetch(guildSettings.PublicModLogChannelId).catch(() => null);
        if (!channel || !channel.isTextBased()) return;

        return await channel.send(reply);
    }

    public async createModerationCase(
        data: NewCaseData,
        afterDbCreateCallback?: (caseDb: ModerationCase) => Promise<void>,
    ) {
        // Create case
        const caseDb = await this.client.db.moderationCase.create({
            data: {
                GuildId: data.GuildId,
                CaseId: (await this.client.db.moderationCase.count({ where: { GuildId: data.GuildId } })) + 1,
                Action: data.Action,
                TargetUserId: data.TargetUserId,
                ModeratorUserId: data.ModeratorUserId,
                Reason: data.Reason,
                AttachmentProof: data.AttachmentProof,
                Duration: data.Duration,
                ModeratorNote: data.ModeratorNote,
                ModeratorAttachment: data.ModeratorAttachment,
                NotAppealable: data.NotAppealable,
                RelatedCaseId: data.RelatedCaseId,
            },
        });

        // Do callback
        if (afterDbCreateCallback) await afterDbCreateCallback(caseDb);

        // Generate embed
        const embed = await this.generateCaseEmbedFromData(
            {
                ...caseDb,
                Removed: false,
                PublicLogMsgId: "",
            },
            undefined,
            false,
            false,
        );

        // Send in public log
        const pubLog = await this.sendGuildPubLog(data.GuildId, { embeds: [embed] });
        if (pubLog)
            await this.client.db.moderationCase.update({
                where: { GlobalCaseId: caseDb.GlobalCaseId },
                data: { PublicModLogMsgId: pubLog.id },
            });

        // Generate full embed
        const fullEmbed = await this.generateCaseEmbedFromData(
            {
                ...caseDb,
                Removed: false,
                PublicLogMsgId: pubLog ? pubLog.id : "",
            },
            await this.client.users.fetch(data.ModeratorUserId).catch(() => undefined),
            true,
            true,
        );

        // Send in private log
        await this.sendGuildLog(data.GuildId, { embeds: [fullEmbed] });

        return {
            globalCaseId: caseDb.GlobalCaseId,
            caseId: caseDb.CaseId,
            embed: embed,
            fullEmbed: fullEmbed,
        };
    }

    public async generateUserVerificationDataEmbed(guildId: string, userId: string, requester?: User) {
        const mainDataDb = await this.client.db.userVerificationData.findUnique({
            where: { UniqueUserPerGuild: { UserId: userId, GuildId: guildId } },
        });
        const dataDb = await this.client.db.userVerificationHistory.findFirst({
            where: { UserId: userId, GuildId: guildId },
            orderBy: { VerificationHistoryId: "desc" },
        });
        const guildSettings = await this.client.db.guild.findUnique({ where: { GuildId: guildId } });
        const embed = new MeteoriumEmbedBuilder(requester);
        const user = await this.client.users.fetch(userId).catch(() => null);
        const updateDate = dataDb?.UpdatedAt || new Date();
        const createdDate = dataDb?.CreatedAt || new Date();

        // Set author field
        embed.setAuthor({
            name: `User Verification Details | ${user != null ? `${user.username} (${user.id})` : userId}`,
            iconURL: user != null ? user.displayAvatarURL({ extension: "png", size: 256 }) : undefined,
        });

        embed.addFields([
            { name: "Status", value: dataDb?.Status.toString() || "Never sent a request" },
            { name: "Banned from verification", value: mainDataDb?.Banned ? "Yes" : "No" },
            { name: "Last request updated at", value: `${time(updateDate, "F")} (${time(updateDate, "R")})` },
            { name: "Last request created at", value: `${time(createdDate, "F")} (${time(createdDate, "R")})` },
        ]);

        if (guildSettings?.VerifyDetailEnabled) {
            embed.addFields([{ name: "Details", value: dataDb?.Detail || "N/A" }]);
        }

        if (guildSettings?.VerifyAttachEnabled) {
            embed.addFields([{ name: "Attachment", value: dataDb?.Attachment || "N/A" }]);
            embed.setImage(dataDb?.Attachment || null);
        }

        if (dataDb?.Status == VerificationStatus.Rejected) {
            embed.addFields([{ name: "Rejection reason", value: dataDb.RejectReason }]);
        }

        return embed;
    }

    public async processVerification(interaction: Interaction<"cached">, fromEvent: boolean) {
        const guildSettings = await this.client.db.guild.findUnique({ where: { GuildId: interaction.guildId } });
        if (!guildSettings) throw new Error("could not get settings from database");

        let verificationData = await this.client.db.userVerificationData.findUnique({
            where: { UniqueUserPerGuild: { GuildId: interaction.guildId, UserId: interaction.user.id } },
            select: { History: true, Banned: true },
        });
        if (!verificationData)
            verificationData = await this.client.db.userVerificationData.create({
                data: { GuildId: interaction.guildId, UserId: interaction.user.id },
                select: { History: true, Banned: true },
            });

        if (!verificationData)
            throw new Error(`could not get/create verification data for ${interaction.user.id}@${interaction.guildId}`);

        // Request submission modal
        if (
            (interaction.isChatInputCommand() && interaction.commandName == "verify" && !fromEvent) ||
            (interaction.isButton() && interaction.customId == "MeteoriumUserVerificationButtonRequest")
        ) {
            if (guildSettings.VerifyTempPaused)
                return await interaction.reply({
                    content:
                        "Verification for this server is currently paused. Contact a server admin for more details.",
                    ephemeral: true,
                });
            if (verificationData.Banned)
                return await interaction.reply({
                    content: "You have been banned from verifying. Contact a server admin for more details.",
                    ephemeral: true,
                });

            const histData = verificationData.History[verificationData.History.length - 1];
            if (histData) {
                if (histData.Status == VerificationStatus.Waiting)
                    return await interaction.reply({
                        content:
                            "You already have a existing verification request. Wait for a server admin to check it.",
                        ephemeral: true,
                    });
                if (histData.Status == VerificationStatus.Approved)
                    return await interaction.reply({
                        content: "You are already verified in this server.",
                        ephemeral: true,
                    });
            }

            if (guildSettings.VerifyDetailEnabled) {
                const modal = new ModalBuilder();
                modal.setCustomId("MeteoriumUserVerificationModal");
                modal.setTitle("Verification request submission");

                const ti = new TextInputBuilder();
                ti.setLabel("Details");
                ti.setCustomId("MeteoriumUserVerificationModalDetails");
                ti.setRequired(true);
                ti.setPlaceholder("Put the details required for verification here");
                ti.setStyle(TextInputStyle.Paragraph);

                const ar = new ActionRowBuilder<TextInputBuilder>();
                ar.addComponents(ti);

                modal.addComponents(ar);

                return await interaction.showModal(modal);
            }

            const attachment = guildSettings.VerifyAttachEnabled
                ? await this.client.db.userVerificationAttachment.findUnique({
                      where: {
                          UniqueAttachmentPerUserPerGuild: {
                              GuildId: interaction.guildId,
                              UserId: interaction.user.id,
                          },
                      },
                  })
                : undefined;

            if (guildSettings.VerifyAttachEnabled && !attachment) {
                return await interaction.reply({
                    ephemeral: true,
                    content: "You have not uploaded a attachment to include with the verification request.",
                });
            }

            await this.client.db.userVerificationHistory.create({
                data: {
                    GuildId: interaction.guildId,
                    UserId: interaction.user.id,
                    Attachment: attachment?.Attachment || "",
                },
            });

            if (guildSettings.VerifyAttachEnabled)
                await this.client.db.userVerificationAttachment.delete({
                    where: {
                        UniqueAttachmentPerUserPerGuild: {
                            GuildId: interaction.guildId,
                            UserId: interaction.user.id,
                        },
                    },
                });

            return await interaction.reply({ ephemeral: true, content: "Verification request submitted." });
        }

        // Modal submission
        if (interaction.isModalSubmit() && interaction.customId == "MeteoriumUserVerificationModal") {
            const details = guildSettings.VerifyDetailEnabled
                ? interaction.fields.getTextInputValue("MeteoriumUserVerificationModalDetails")
                : undefined;
            const attachment = guildSettings.VerifyAttachEnabled
                ? await this.client.db.userVerificationAttachment.findUnique({
                      where: {
                          UniqueAttachmentPerUserPerGuild: {
                              GuildId: interaction.guildId,
                              UserId: interaction.user.id,
                          },
                      },
                  })
                : undefined;

            const histData = verificationData.History[verificationData.History.length - 1];
            if (histData && histData.Status == VerificationStatus.Waiting)
                return await interaction.reply({
                    content: "You already have a existing verification request. Wait for a server admin to check it.",
                    ephemeral: true,
                });

            await interaction.deferReply({ ephemeral: true });

            if (guildSettings.VerifyAttachEnabled && !attachment) {
                return await interaction.editReply(
                    "You have not uploaded a attachment to include with the verification request.",
                );
            }

            await this.client.db.userVerificationHistory.create({
                data: {
                    GuildId: interaction.guildId,
                    UserId: interaction.user.id,
                    Detail: details,
                    Attachment: attachment?.Attachment || "",
                },
            });

            if (guildSettings.VerifyAttachEnabled)
                await this.client.db.userVerificationAttachment.delete({
                    where: {
                        UniqueAttachmentPerUserPerGuild: {
                            GuildId: interaction.guildId,
                            UserId: interaction.user.id,
                        },
                    },
                });

            return await interaction.editReply("Verification request submitted.");
        }

        // Approve request action
        if (interaction.isButton() && interaction.customId.startsWith("MeteoriumUserVerificationApprove-")) {
            const targetUserId = interaction.customId.replaceAll("MeteoriumUserVerificationApprove-", "");
            await interaction.deferUpdate();

            const data = await this.client.db.userVerificationHistory.findFirst({
                where: { GuildId: interaction.guildId, UserId: targetUserId },
                orderBy: { VerificationHistoryId: "desc" },
            });
            if (!data)
                return await interaction.editReply({
                    content: "internal error: data doesn't exist?",
                    embeds: [],
                    components: [],
                });

            await this.client.db.userVerificationHistory.update({
                where: { VerificationHistoryId: data.VerificationHistoryId },
                data: {
                    Status: VerificationStatus.Approved,
                    CheckerUserId: interaction.user.id,
                    UpdatedAt: new Date(),
                },
            });

            const promises: Promise<any>[] = [];
            const updateRolePromise = new Promise<void>(async (resolve) => {
                const member = await interaction.guild.members.fetch(targetUserId).catch(() => null);
                if (member) await this.updateMemberVerificationRole(member);
                return resolve();
            });
            try {
                const user = await this.client.users.fetch(targetUserId).catch(() => null);
                if (user) {
                    const embed = new MeteoriumEmbedBuilder();
                    embed.setTitle("Verification status");
                    embed.setDescription("Congratulations, your verification request was approved!");
                    embed.addFields([{ name: "Server", value: `${interaction.guild.name} (${interaction.guild.id})` }]);
                    embed.setColor("Green");
                    promises.push(user.send({ embeds: [embed] }));
                }
            } catch (e) {}
            promises.push(updateRolePromise);
            await Promise.all(promises);

            return await interaction.editReply({
                content: "Processing completed - user verification request approved.",
                embeds: [],
                components: [],
            });
        }

        // Reject request action
        if (interaction.isButton() && interaction.customId.startsWith("MeteoriumUserVerificationReject-")) {
            const targetUserId = interaction.customId.replaceAll("MeteoriumUserVerificationReject-", "");
            await interaction.deferUpdate();

            const openReasonButton = new ButtonBuilder();
            openReasonButton.setLabel("Open modal");
            openReasonButton.setCustomId(`MeteoriumUserVerificationRejectReasonButton-${targetUserId}`);
            openReasonButton.setStyle(ButtonStyle.Primary);

            const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents([openReasonButton]);
            await interaction.followUp({
                content: "Click the button below to open a modal to fill the rejection reason.",
                ephemeral: true,
                components: [actionRow],
            });

            return await interaction.editReply({
                content: "See follow-up message for the next step.",
                embeds: [],
                components: [],
            });
        }

        // Button for handling rejection open modal
        if (interaction.isButton() && interaction.customId.startsWith("MeteoriumUserVerificationRejectReasonButton-")) {
            const targetUserId = interaction.customId.replaceAll("MeteoriumUserVerificationRejectReasonButton-", "");

            const modal = new ModalBuilder();
            modal.setCustomId(`MeteoriumUserVerificationRejectFinal-${targetUserId}`);
            modal.setTitle(`Verification rejection reason`);

            const ti = new TextInputBuilder();
            ti.setLabel("Details");
            ti.setCustomId("MeteoriumUserVerificationRejectFinalReason");
            ti.setRequired(true);
            ti.setPlaceholder("Why was this user's verification rejected?");
            ti.setStyle(TextInputStyle.Short);

            const ar = new ActionRowBuilder<TextInputBuilder>();
            ar.addComponents(ti);
            modal.addComponents(ar);

            return await interaction.showModal(modal);
        }

        // Reject final modal (reason modal)
        if (interaction.isModalSubmit() && interaction.customId.startsWith("MeteoriumUserVerificationRejectFinal-")) {
            const targetUserId = interaction.customId.replaceAll("MeteoriumUserVerificationRejectFinal-", "");
            const rejectReason = interaction.fields.getTextInputValue("MeteoriumUserVerificationRejectFinalReason");
            await interaction.deferUpdate();

            const data = await this.client.db.userVerificationHistory.findFirst({
                where: { GuildId: interaction.guildId, UserId: targetUserId },
                orderBy: { VerificationHistoryId: "desc" },
            });
            if (!data)
                return await interaction.editReply({
                    content: "internal error: data doesn't exist?",
                    embeds: [],
                    components: [],
                });

            await this.client.db.userVerificationHistory.update({
                where: { VerificationHistoryId: data.VerificationHistoryId },
                data: {
                    Status: VerificationStatus.Rejected,
                    CheckerUserId: interaction.user.id,
                    RejectReason: rejectReason,
                    UpdatedAt: new Date(),
                },
            });

            const promises: Promise<any>[] = [];
            const updateRolePromise = new Promise<void>(async (resolve) => {
                const member = await interaction.guild.members.fetch(targetUserId).catch(() => null);
                if (member) await this.updateMemberVerificationRole(member);
                return resolve();
            });
            try {
                const user = await this.client.users.fetch(targetUserId).catch(() => null);
                if (user) {
                    const embed = new MeteoriumEmbedBuilder();
                    embed.setTitle("Verification status");
                    embed.setDescription("Unfortunately, your verification request was rejected.");
                    embed.addFields([
                        { name: "Server", value: `${interaction.guild.name} (${interaction.guild.id})` },
                        { name: "Reason", value: rejectReason },
                    ]);
                    embed.setColor("Red");
                    promises.push(user.send({ embeds: [embed] }));
                }
            } catch (e) {}
            promises.push(updateRolePromise);
            await Promise.all(promises);

            return await interaction.editReply({
                content: "Processing completed - user verification request rejected.",
                embeds: [],
                components: [],
            });
        }

        return;
    }

    public async updateMemberVerificationRole(member: GuildMember) {
        const guildSettings = await this.client.db.guild.findUnique({ where: { GuildId: member.guild.id } });
        if (!guildSettings) throw new Error("could not get settings from database");
        if (guildSettings.EnabledGuildFeatures.indexOf(GuildFeatures.UserVerification) == -1) return;

        const verRole =
            guildSettings.VerifyVerifiedRoleId != ""
                ? await member.guild.roles.fetch(guildSettings.VerifyVerifiedRoleId).catch(() => null)
                : null;
        const unVerRole =
            guildSettings.VerifyUnverifiedRoleId != ""
                ? await member.guild.roles.fetch(guildSettings.VerifyUnverifiedRoleId).catch(() => null)
                : null;

        const verHistData = await this.client.db.userVerificationHistory.findFirst({
            where: { GuildId: member.guild.id, UserId: member.id },
            orderBy: { VerificationHistoryId: "desc" },
            include: { MainData: true },
        });

        if (verHistData?.Status == VerificationStatus.Approved) {
            if (unVerRole && member.roles.cache.has(unVerRole.id)) {
                await member.roles.remove(unVerRole);
            }
            if (verRole) await member.roles.add(verRole);
        } else {
            if (verRole && member.roles.cache.has(verRole.id)) {
                await member.roles.remove(verRole);
            }
            if (unVerRole) await member.roles.add(unVerRole);
        }

        return;
    }

    public async generateModPingMentions(guildId: string, amount: number, pingRole: boolean) {
        const guildSettings = await this.client.db.guild.findUnique({ where: { GuildId: guildId } });
        if (!guildSettings) throw new Error("could not get settings from database");
        if (guildSettings.ModPingRoleId == "") return false;

        if (!pingRole) {
            const guild = await this.client.guilds.fetch(guildId).catch(() => null);
            if (!guild) throw new Error(`failed to fetch guild ${guildId}`);

            const role = await guild.roles.fetch(guildSettings.ModPingRoleId).catch(() => null);
            if (!role) throw new Error(`failed to fetch role ${guildSettings.ModPingRoleId} from ${guildId}`);

            const onlineUsers = role.members.map((v) => v);
            //const onlineUsers = role.members
            //    .map((v) => {
            //        if (v.presence?.status != "offline") return v;
            //        return;
            //    })
            //    .filter((v) => v != undefined);

            const picked: GuildMember[] = [];
            while (picked.length <= amount && picked.length != onlineUsers.length) {
                const selected = onlineUsers[this.getRandomInt(0, onlineUsers.length - 1)];
                if (picked.indexOf(selected) == -1) picked.push(selected);
            }

            //return picked.map((v) => `<@!${v.user.id}>`).join(" ");
            return picked.map((v) => `${v.user.username}<${v.user.id}>`).join(" ");
        }

        return `<@!${guildSettings.ModPingRoleId}>`;
    }

    public async generateModPingEmbedActionRow(
        requester: User,
        guildId: string,
        repeated: number,
        finished: boolean,
        concludor?: User,
    ) {
        const embed = new MeteoriumEmbedBuilder(requester);
        embed.setTitle("Mod ping");
        embed.setDescription(
            finished
                ? "This mod ping call has been concluded."
                : "A mod ping was initiated. Once attended by a moderator press the button below to end the mod ping call.",
        );
        embed.addFields([
            { name: "Requested by", value: userMention(requester.id) },
            { name: "Repeated", value: repeated.toString() },
        ]);

        if (concludor) embed.addFields([{ name: "Concluded by", value: userMention(concludor.id) }]);

        const btn = new ButtonBuilder();
        btn.setCustomId(`MeteoriumModPingConclude-${requester.id}-${guildId}`);
        btn.setLabel("Conclude");
        btn.setStyle(ButtonStyle.Success);
        btn.setDisabled(finished);

        const ar = new ActionRowBuilder<ButtonBuilder>();
        ar.addComponents(btn);

        return { embed: embed, actionRow: ar };
    }

    public async processModPing(guildId: string, userId: string, interaction?: Interaction<"cached">) {
        const guildSettings = await this.client.db.guild.findUnique({ where: { GuildId: guildId } });
        if (!guildSettings) throw new Error("could not get settings from database");

        if (guildSettings.ModPingRoleId == "") {
            if (interaction && interaction.isChatInputCommand())
                return await interaction.reply({
                    ephemeral: true,
                    content:
                        "This server's configuration is incomplete to have mod ping functionality. Contact a server admin about this.",
                });
            return;
        }
        const data = this.modPingData.get(`${userId}-${guildId}`);

        if (interaction) {
            if (interaction.isButton() && interaction.customId.startsWith("MeteoriumModPingConclude-")) {
                if (!interaction.member.roles.cache.has(guildSettings.ModPingRoleId))
                    return await interaction.reply({
                        ephemeral: true,
                        content: "Only moderators may press this button.",
                    });

                const modPingId = interaction.customId.replaceAll("MeteoriumModPingConclude-", "");
                const [userId, guildId] = modPingId.split("-");

                const data = this.modPingData.get(modPingId);
                let requesterUser = interaction.user;

                if (data) {
                    this.modPingData.delete(modPingId);
                    const channel = await this.client.channels.fetch(data.channelId).catch(() => null);
                    requesterUser = (await this.client.users.fetch(userId).catch(() => null)) || requesterUser;
                    if (channel && channel.isTextBased())
                        data.callMessageIds.forEach(async (v) => {
                            const msg = await channel.messages.fetch(v).catch(() => null);
                            if (msg) {
                                const { embed, actionRow } = await this.generateModPingEmbedActionRow(
                                    requesterUser,
                                    guildId,
                                    0,
                                    true,
                                    interaction.user,
                                );
                                await msg.edit({ embeds: [embed], components: [actionRow] });
                            }
                        });
                }

                return await interaction.reply({ ephemeral: true, content: "Mod ping concluded." });
            }
            if (interaction.isChatInputCommand()) {
                if (data) {
                    return await interaction.reply({
                        ephemeral: true,
                        content: "You have already initiated a mod ping and it is still on-going.",
                    });
                }

                const mentions = await this.generateModPingMentions(guildId, 3, false);
                const msgData = await this.generateModPingEmbedActionRow(
                    interaction.user,
                    interaction.guildId,
                    0,
                    false,
                );
                if (!mentions) return;

                const msg = await interaction.channel?.send({
                    content: mentions,
                    embeds: [msgData.embed],
                    components: [msgData.actionRow],
                });
                if (!msg) return;

                this.modPingData.set(`${userId}-${guildId}`, {
                    amount: 3,
                    repeated: 0,
                    channelId: interaction.channelId,
                    callMessageIds: [msg.id],
                });

                return await interaction.reply({ ephemeral: true, content: "Mod ping initiated." });
            }
            return;
        }

        if (!data) return;
        data.repeated += 1;
        data.amount += 1;

        const user = await this.client.users.fetch(userId).catch(() => null);
        if (!user) throw new Error(`could not fetch user ${user}`);

        const channel = await this.client.channels.fetch(data.channelId).catch(() => null);
        if (!channel) throw new Error(`could not fetch chanel ${data.channelId}`);
        if (!channel.isTextBased()) return this.modPingData.delete(`${userId}-${guildId}`);

        if (data.repeated > 4) {
            const mentions = await this.generateModPingMentions(guildId, data.amount, true);
            const msgData = await this.generateModPingEmbedActionRow(user, guildId, data.repeated, false);
            if (!mentions) return;

            const msg = await channel.send({
                content: mentions,
                embeds: [msgData.embed],
                components: [msgData.actionRow],
            });
            data.callMessageIds.push(msg.id);
            return;
        }

        const mentions = await this.generateModPingMentions(guildId, data.amount, false);
        const msgData = await this.generateModPingEmbedActionRow(user, guildId, data.repeated, false);
        if (!mentions) return;

        const msg = await channel.send({
            content: mentions,
            embeds: [msgData.embed],
            components: [msgData.actionRow],
        });
        data.callMessageIds.push(msg.id);
        return;
    }

    public getRandomInt(min: number, max: number) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}
