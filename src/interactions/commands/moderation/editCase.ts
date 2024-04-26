import { PermissionFlagsBits, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import type { MeteoriumChatCommand } from "../../index.js";
import { CaseData } from "../../../classes/dbUtils.js";
import { GuildFeatures } from "@prisma/client";

export const Command: MeteoriumChatCommand = {
    interactionData: new SlashCommandBuilder()
        .setName("editcase")
        .setDescription("Edits a case")
        .addNumberOption((option) =>
            option.setName("caseid").setDescription("The id of the case you want to view").setRequired(true),
        )
        .addStringOption((option) =>
            option.setName("reason").setDescription("The reason why this user was moderated").setRequired(false),
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
        .addBooleanOption((option) =>
            option.setName("notappealable").setDescription("Is this ban appealable?").setRequired(false),
        )
        .addStringOption((option) =>
            option.setName("modnote").setDescription("Internal moderation note").setRequired(false),
        )
        .addAttachmentOption((option) =>
            option.setName("modattach").setDescription("Internal moderation attachment").setRequired(false),
        )
        .addBooleanOption((option) =>
            option
                .setName("remproof")
                .setDescription("Remove the attachment proof (this takes priority)")
                .setRequired(false),
        )
        .addBooleanOption((option) =>
            option
                .setName("remmodattach")
                .setDescription("Remove the moderation attachment (this takes priority)")
                .setRequired(false),
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false),
    requiredFeature: GuildFeatures.Moderation,
    async callback(interaction, client) {
        const caseId = interaction.options.getNumber("caseid", true);
        const reason = interaction.options.getString("reason", false);
        const proof = interaction.options.getAttachment("proof", false);
        const duration = interaction.options.getString("duration", false);
        const notAppealable = interaction.options.getBoolean("notappealable", false);
        const moderationNote = interaction.options.getString("modnote", false);
        const moderationAttach = interaction.options.getAttachment("modattach", false);
        const removeProof = interaction.options.getBoolean("remproof", false) || false;
        const removeModAttach = interaction.options.getBoolean("remmodattach", false) || false;

        // Check if any field is modified
        if (
            !reason &&
            !proof &&
            !duration &&
            typeof notAppealable != "boolean" &&
            !moderationNote &&
            !moderationAttach &&
            !removeProof &&
            !removeModAttach
        )
            return interaction.reply({ content: "There are no modified fields.", ephemeral: true });

        // Defer reply
        const sentReplyMsg = await interaction.deferReply({ ephemeral: true, fetchReply: true });

        // Case data
        const caseData = await client.dbUtils.getCaseData(interaction.guildId, caseId);
        if (!caseData) return await interaction.editReply({ content: `Case #${caseId} does not exist.` });
        if (caseData.Removed) return await interaction.editReply({ content: `Case #${caseId} is a removed case.` });

        // New case data
        const newCaseData: CaseData = {
            GlobalCaseId: caseData.GlobalCaseId,
            CaseId: caseData.CaseId,
            Action: caseData.Action,
            TargetUserId: caseData.TargetUserId,
            ModeratorUserId: caseData.ModeratorUserId,
            Active: caseData.Active,
            RelatedCaseId: caseData.RelatedCaseId,
            PublicLogMsgId: caseData.PublicLogMsgId,
            CreatedAt: caseData.CreatedAt,

            Reason: reason ? reason : caseData.Reason,
            AttachmentProof: removeProof ? "" : proof ? proof.url : caseData.AttachmentProof,
            Duration: duration ? duration : caseData.Duration,
            ModeratorNote: moderationNote ? moderationNote : caseData.ModeratorNote,
            ModeratorAttachment: removeModAttach
                ? ""
                : moderationAttach
                  ? moderationAttach.url
                  : caseData.ModeratorAttachment,
            NotAppealable: typeof notAppealable == "boolean" ? notAppealable : caseData.NotAppealable,
            Removed: caseData.Removed,
        };

        // Embed previews
        const oldDataEmbed = await client.dbUtils.generateCaseEmbedFromData(caseData, interaction.user, true);
        const newDataEmbed = await client.dbUtils.generateCaseEmbedFromData(newCaseData, interaction.user, true);

        // Action row buttons
        const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents([
            new ButtonBuilder().setLabel("No").setCustomId("no").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setLabel("Yes").setCustomId("yes").setStyle(ButtonStyle.Danger),
        ]);

        // Edit the reply
        await interaction.editReply({
            content: "Are you sure you want to remove this edit case? (new top, old bottom)",
            embeds: [newDataEmbed, oldDataEmbed],
            components: [actionRow],
        });

        // Collector
        const collector = sentReplyMsg.createMessageComponentCollector({ idle: 150000 });
        collector.on("collect", async (collectInteraction) => {
            switch (collectInteraction.customId) {
                case "yes": {
                    // Create patch
                    await client.db.moderationCaseHistory.create({
                        data: {
                            GlobalCaseId: caseData.GlobalCaseId,
                            EditorUserId: interaction.user.id,
                            Reason: reason || undefined,
                            AttachmentProof: removeProof ? "" : proof ? proof.url : undefined,
                            Duration: duration || undefined,
                            ModeratorNote: moderationNote || undefined,
                            ModeratorAttachment: removeModAttach
                                ? ""
                                : moderationAttach
                                  ? moderationAttach.url
                                  : undefined,
                            NotAppealable: typeof notAppealable == "boolean" ? notAppealable : undefined,
                            Removed: undefined,
                        },
                    });

                    // Edit the reply
                    const editCount = await client.db.moderationCaseHistory.count({ where: { GlobalCaseId: caseId } });
                    await interaction.editReply({
                        content: `Case #${caseId} edited. (Edit #${editCount})`,
                        embeds: [newDataEmbed],
                        components: [],
                    });

                    // Logging
                    await client.dbUtils.sendGuildLog(interaction.guildId, {
                        content: `Case #${caseId} edited. (Edit #${editCount}) (new top, previous bottom)`,
                        embeds: [
                            await client.dbUtils.generateCaseEmbedFromData(newCaseData, interaction.user, true, true),
                            await client.dbUtils.generateCaseEmbedFromData(caseData, interaction.user, true, true),
                        ],
                    });

                    break;
                }
                case "no": {
                    await interaction.editReply({ content: "Case editing cancelled.", embeds: [], components: [] });
                    break;
                }
            }

            return;
        });
        collector.on("end", async () => {
            await interaction.editReply({ content: "Timed out.", embeds: [], components: [] });
            return;
        });
    },
};
