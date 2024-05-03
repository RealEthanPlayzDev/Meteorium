import { PermissionFlagsBits, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import type { MeteoriumChatCommand } from "../../index.js";
import { CaseData } from "../../../classes/dbUtils.js";
import { ModerationAction, GuildFeatures } from "@prisma/client";

export const Command: MeteoriumChatCommand = {
    interactionData: new SlashCommandBuilder()
        .setName("createcase")
        .setDescription("Creates a new case (for actions taken when bot was offline)")
        .addStringOption((option) =>
            option
                .setName("action")
                .setDescription("The action moderator took")
                .setRequired(true)
                .addChoices(
                    { name: "ban", value: "ban" },
                    { name: "unban", value: "unban" },
                    { name: "kick", value: "kick" },
                    { name: "mute", value: "mute" },
                    { name: "warn", value: "warn" },
                    { name: "tempban", value: "tempban" },
                ),
        )
        .addUserOption((option) =>
            option.setName("user").setDescription("The user that received moderation").setRequired(true),
        )
        .addStringOption((option) =>
            option.setName("reason").setDescription("The reason why this user was moderated").setRequired(true),
        )
        .addUserOption((option) =>
            option
                .setName("moderator")
                .setDescription("The moderator who took moderated the user, if empty defaults to you")
                .setRequired(false),
        )
        .addNumberOption((option) =>
            option
                .setName("relcid")
                .setDescription("Related case id (in unban, this is the ban case id)")
                .setRequired(false),
        )
        .addAttachmentOption((option) =>
            option
                .setName("proof")
                .setDescription("The attachment proof on why this user needed to be moderated")
                .setRequired(false),
        )
        .addStringOption((option) =>
            option.setName("duration").setDescription("The duration of the mute/temp-ban").setRequired(false),
        )
        .addStringOption((option) =>
            option.setName("modnote").setDescription("Internal moderation note").setRequired(false),
        )
        .addAttachmentOption((option) =>
            option.setName("modattach").setDescription("Internal moderation attachment").setRequired(false),
        )
        .addBooleanOption((option) =>
            option.setName("notappealable").setDescription("Is this ban appealable?").setRequired(false),
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false),
    requiredFeature: GuildFeatures.Moderation,
    async callback(interaction, client) {
        const actionStr = interaction.options.getString("action", true);
        const user = interaction.options.getUser("user", true);
        const moderator = interaction.options.getUser("moderator", false) || interaction.user;
        const relatedCaseId = interaction.options.getNumber("relcid", false);
        const reason = interaction.options.getString("reason", true);
        const proof = interaction.options.getAttachment("proof", false);
        const duration = interaction.options.getString("duration", false);
        const moderationNote = interaction.options.getString("modnote", false);
        const moderationAttach = interaction.options.getAttachment("modattach", false);
        const notAppealable = interaction.options.getBoolean("notappealable", false);

        // Determine action
        let action: ModerationAction;
        switch (actionStr) {
            case "ban": {
                action = ModerationAction.Ban;
                break;
            }
            case "tempban": {
                action = ModerationAction.TempBan;
                break;
            }
            case "kick": {
                action = ModerationAction.Kick;
                break;
            }
            case "mute": {
                action = ModerationAction.Mute;
                break;
            }
            case "warn": {
                action = ModerationAction.Warn;
                break;
            }
            case "unban": {
                action = ModerationAction.Unban;
                break;
            }
            default: {
                throw new Error("CreateCase action switch reached impossible conclusion");
            }
        }

        // Sanity checks
        if (moderator.bot)
            return await interaction.reply({ content: "The moderator can't be a bot.", ephemeral: true });
        if (user.bot) return await interaction.reply({ content: "Moderating bots aren't possible.", ephemeral: true });
        if (action == ModerationAction.Unban && relatedCaseId == null)
            return await interaction.reply({
                content: "Unban cases require a related ban moderation case.",
                ephemeral: true,
            });
        if ((action == ModerationAction.Mute || action == ModerationAction.TempBan) && duration == null)
            return await interaction.reply({ content: "Missing duration field.", ephemeral: true });
        if (action == ModerationAction.Ban && notAppealable == null)
            return await interaction.reply({
                content: "Not appealable field must be explicitly set.",
                ephemeral: true,
            });

        // Defer reply
        const sentReplyMsg = await interaction.deferReply({ ephemeral: true, fetchReply: true });

        // Get guild settings
        const guildSettings = await client.db.guild.findUnique({ where: { GuildId: interaction.guildId } });
        if (!guildSettings) throw new Error(`no guild settings for guild ${interaction.guildId}`);

        // Get related case id
        const relatedCaseData: CaseData | null = relatedCaseId
            ? (await client.dbUtils.getCaseData(interaction.guildId, relatedCaseId)) || null
            : null;
        if (action == ModerationAction.Unban && relatedCaseData == null)
            return await interaction.editReply({ content: "Could not fetch related case data." });
        if (action == ModerationAction.Unban && relatedCaseData!.Action != ModerationAction.Ban)
            return await interaction.editReply({ content: "The related case is not a ban case." });
        if (action == ModerationAction.Unban && !relatedCaseData!.Active)
            return await interaction.editReply({ content: "This related ban case is no longer active." });
        if (action == ModerationAction.Unban && relatedCaseData!.TargetUserId != user.id)
            return await interaction.editReply({
                content: "The user id does not match between the data specified here and the related case data.",
            });

        // Active ban case check
        // TODO: god dammit make this look better
        const prevBanCase = await client.dbUtils.getCaseData(
            interaction.guildId,
            (await client.db.moderationCase.findFirst({
                where: {
                    OR: [
                        { GuildId: interaction.guildId, TargetUserId: user.id, Action: ModerationAction.Ban },
                        { GuildId: interaction.guildId, TargetUserId: user.id, Action: ModerationAction.TempBan },
                    ],
                },
                orderBy: {
                    GlobalCaseId: "desc",
                },
                select: { CaseId: true },
            }))!.CaseId,
        );
        if (prevBanCase && prevBanCase.Active && !prevBanCase.Removed)
            return await interaction.editReply({
                content: "This user currently has an active ban/tempban case.",
            });

        // Generate embed
        const embed = await client.dbUtils.generateCaseEmbedFromData(
            {
                GlobalCaseId: -1,
                CaseId: -1,
                Action: action,
                TargetUserId: user.id,
                ModeratorUserId: moderator.id,
                Active: true,
                RelatedCaseId: relatedCaseId || -1,
                PublicLogMsgId: "",
                CreatedAt: new Date(),

                Reason: reason,
                AttachmentProof: proof ? proof.url : "",
                Duration: duration || "0",
                ModeratorNote: moderationNote || "",
                ModeratorAttachment: moderationAttach ? moderationAttach.url : "",
                NotAppealable: notAppealable || false,
                Removed: false,
            },
            interaction.user,
            true,
        );

        // Action row buttons
        const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents([
            new ButtonBuilder().setLabel("No").setCustomId("no").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setLabel("Yes").setCustomId("yes").setStyle(ButtonStyle.Danger),
        ]);

        // Edit the reply
        await interaction.editReply({
            content:
                "Are you sure you want to create a new case with the following data?\n(Note that some data may change after you press yes, mainly dates and ids)",
            embeds: [embed],
            components: [actionRow],
        });

        // Collector
        const collector = sentReplyMsg.createMessageComponentCollector({ idle: 150000 });
        collector.on("collect", async (collectInteraction) => {
            switch (collectInteraction.customId) {
                case "yes": {
                    // Push into db
                    const data = await client.db.moderationCase.create({
                        data: {
                            GuildId: interaction.guildId,
                            CaseId:
                                (await client.db.moderationCase.count({ where: { GuildId: interaction.guildId } })) + 1,
                            Action: action,
                            TargetUserId: user.id,
                            ModeratorUserId: moderator.id,
                            Reason: reason,
                            AttachmentProof: proof ? proof.url : "",
                            Duration:
                                action == ModerationAction.Mute || action == ModerationAction.TempBan
                                    ? duration!
                                    : undefined,
                            ModeratorNote: moderationNote || "",
                            ModeratorAttachment: moderationAttach ? moderationAttach.url : "",
                            NotAppealable: action == ModerationAction.Ban ? notAppealable! : undefined,
                            RelatedCaseId: action == ModerationAction.Unban ? relatedCaseId! : undefined,
                        },
                    });

                    // Update related ban case if unban
                    if (action == ModerationAction.Unban)
                        await client.db.moderationCase.update({
                            where: { GlobalCaseId: relatedCaseData!.GlobalCaseId },
                            data: {
                                Active: false,
                                RelatedCaseId: data.CaseId,
                            },
                        });

                    // Generate new embed based on db data
                    const dbDataEmbedFull = await client.dbUtils.generateCaseEmbedFromCaseId(
                        interaction.guildId,
                        data.CaseId,
                        interaction.user,
                        true,
                    );

                    const dbDataEmbedPublic = await client.dbUtils.generateCaseEmbedFromCaseId(
                        interaction.guildId,
                        data.CaseId,
                        interaction.user,
                        false,
                    );

                    // Edit reply
                    await interaction.editReply({
                        content: `Created new case #${data.CaseId}.`,
                        embeds: dbDataEmbedFull ? [dbDataEmbedFull] : [], // TODO: Handle this better?
                        components: [],
                    });

                    // Post in public moderation log
                    if (dbDataEmbedPublic)
                        await client.dbUtils.sendGuildPubLog(interaction.guildId, { embeds: [dbDataEmbedPublic] });

                    // Post in internal server log
                    await client.dbUtils.sendGuildLog(interaction.guildId, {
                        content: `New case manually created: #${data.CaseId}`,
                        embeds: dbDataEmbedFull ? [dbDataEmbedFull] : [],
                    });

                    break;
                }
                case "no": {
                    await interaction.editReply({ content: "Case creation cancelled.", embeds: [], components: [] });
                    break;
                }
            }
        });
        collector.on("end", async () => {
            await interaction.editReply({ content: "Timed out.", embeds: [], components: [] });
            return;
        });
    },
};
