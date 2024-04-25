import { PermissionFlagsBits, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { GuildFeatures, ModerationAction } from "@prisma/client";
import type { MeteoriumChatCommand } from "../../index.js";

export const Command: MeteoriumChatCommand = {
    interactionData: new SlashCommandBuilder()
        .setName("unban")
        .setDescription("Deactivate a ban punishment")
        .addNumberOption((option) =>
            option.setName("relcid").setDescription("The ban case id that will be deactivated").setRequired(true),
        )
        .addStringOption((option) =>
            option.setName("reason").setDescription("The reason why this user was unbanned").setRequired(true),
        )
        .addAttachmentOption((option) =>
            option
                .setName("proof")
                .setDescription("The attachment proof on why this user got unbanned")
                .setRequired(false),
        )
        .addStringOption((option) =>
            option.setName("modnote").setDescription("Internal moderation note").setRequired(false),
        )
        .addAttachmentOption((option) =>
            option.setName("modattach").setDescription("Internal moderation attachment").setRequired(false),
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .setDMPermission(false),
    requiredFeature: GuildFeatures.Moderation,
    async callback(interaction, client) {
        const relatedCaseId = interaction.options.getNumber("relcid", true);
        const reason = interaction.options.getString("reason", true);
        const proof = interaction.options.getAttachment("proof", false);
        const moderationNote = interaction.options.getString("modnote", false);
        const moderationAttach = interaction.options.getAttachment("modattach", false);
        const moderator = interaction.user;

        // Sanity checks
        if (moderator.bot)
            return await interaction.reply({ content: "The moderator can't be a bot.", ephemeral: true });

        // Defer reply
        const sentReplyMsg = await interaction.deferReply({ ephemeral: true, fetchReply: true });

        // Get related ban case and validate it
        const banCase = await client.dbUtils.getCaseData(interaction.guildId, relatedCaseId);
        if (!banCase) return await interaction.editReply({ content: `Case #${relatedCaseId} doesn't exist.` });
        if (banCase.Action != ModerationAction.Ban)
            return await interaction.editReply({ content: `Case #${relatedCaseId} isn't a ban case.` });

        // Ban case embed
        const banEmbed = await client.dbUtils.generateCaseEmbedFromData(banCase, interaction.user, true, false);

        // Action row buttons
        const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents([
            new ButtonBuilder().setLabel("No").setCustomId("no").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setLabel("Yes").setCustomId("yes").setStyle(ButtonStyle.Danger),
        ]);

        // Edit reply
        await interaction.editReply({
            content: "Are you sure you want to deactivate (unban) the following case?",
            embeds: [banEmbed],
            components: [actionRow],
        });

        // Collector
        const collector = sentReplyMsg.createMessageComponentCollector({ idle: 150000 });
        collector.on("collect", async (collectInteraction) => {
            switch (collectInteraction.customId) {
                case "yes": {
                    // Create case
                    const { caseId, embed } = await client.dbUtils.createModerationCase({
                        Action: ModerationAction.Unban,
                        GuildId: interaction.guildId,
                        TargetUserId: banCase.TargetUserId,
                        ModeratorUserId: moderator.id,
                        Reason: reason,
                        AttachmentProof: proof?.url,
                        ModeratorNote: moderationNote || undefined,
                        ModeratorAttachment: moderationAttach?.url,
                        RelatedCaseId: relatedCaseId,
                    });

                    await client.db.moderationCase.update({
                        where: { GlobalCaseId: banCase.GlobalCaseId },
                        data: {
                            Active: false,
                            RelatedCaseId: caseId,
                        },
                    });

                    // Unban
                    await interaction.guild.members.unban(banCase.TargetUserId, `Case #${caseId}: ${reason}`);

                    // Edit reply
                    await interaction.editReply({
                        content: `Deactivated ban in case #${relatedCaseId}.`,
                        embeds: [embed],
                        components: [],
                    });
                    break;
                }
                case "no": {
                    await interaction.editReply({ content: "Unban action cancelled.", embeds: [], components: [] });
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
