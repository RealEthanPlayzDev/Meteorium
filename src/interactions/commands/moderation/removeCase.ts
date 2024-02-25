import { PermissionFlagsBits, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { ModerationAction } from "@prisma/client";
import type { MeteoriumChatCommand } from "../../index.js";

export const Command: MeteoriumChatCommand = {
    interactionData: new SlashCommandBuilder()
        .setName("removecase")
        .setDescription("Removes a moderation case")
        .addNumberOption((option) =>
            option.setName("caseid").setDescription("The id of the case you want to remove").setRequired(true),
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false),
    async callback(interaction, client) {
        const caseId = interaction.options.getNumber("caseid", true);

        // Defer reply
        const sentReplyMsg = await interaction.deferReply({ ephemeral: true, fetchReply: true });

        // Get case data
        const caseData = await client.dbUtils.getCaseData(interaction.guildId, caseId);
        if (!caseData) return await interaction.editReply({ content: `Case #${caseId} does not exist.` });
        if (caseData.Removed)
            return await interaction.editReply({ content: `Case #${caseId} has been already marked as removed.` });

        // Get guild settings
        const guildSettings = await client.db.guild.findUnique({ where: { GuildId: interaction.guildId } });
        if (!guildSettings) throw new Error(`no guild settings for guild ${interaction.guildId}`);

        // Case embed
        const caseEmbed = await client.dbUtils.generateCaseEmbedFromData(caseData, interaction.user, true, false);

        // Action row buttons
        const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents([
            new ButtonBuilder().setLabel("No").setCustomId("no").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setLabel("Yes").setCustomId("yes").setStyle(ButtonStyle.Danger),
        ]);

        // Edit the reply
        await interaction.editReply({
            content: "Are you sure you want to remove this case?",
            embeds: [caseEmbed],
            components: [actionRow],
        });

        // Collector
        const collector = sentReplyMsg.createMessageComponentCollector({ idle: 150000 });
        collector.on("collect", async (collectInteraction) => {
            switch (collectInteraction.customId) {
                case "yes": {
                    // Mark case deleted
                    await client.db.moderationCaseHistory.create({
                        data: {
                            GlobalCaseId: caseData.GlobalCaseId,
                            EditorUserId: interaction.user.id,
                            Removed: true,
                        },
                    });

                    // Reply content
                    let replyContent = `Case #${caseData.CaseId} removed.`;

                    // Untimeout/unban
                    if (caseData.Action == ModerationAction.Mute) {
                        const targetGuildMember = await interaction.guild.members
                            .fetch(caseData.TargetUserId)
                            .catch(() => null);
                        if (targetGuildMember)
                            targetGuildMember.timeout(
                                null,
                                `Case #${caseData.CaseId} removed by ${interaction.user.username} (${interaction.user.id})`,
                            );
                        else
                            replyContent +=
                                "(Warning: could not remove the timeout. You will have to remove the timeout manually.)";
                    } else if (caseData.Action == ModerationAction.TempBan) {
                        const targetUser = await client.users.fetch(caseData.TargetUserId).catch(() => null);
                        if (targetUser)
                            interaction.guild.members.unban(
                                targetUser,
                                `Case #${caseData.CaseId} removed by ${interaction.user.username} (${interaction.user.id})`,
                            );
                        else
                            replyContent +=
                                "(Warning: could not remove the ban. You will have to remove the ban manually.)";

                        await client.db.activeTempBans.delete({
                            where: { GlobalCaseId: caseData.GlobalCaseId },
                        });
                    } else if (caseData.Action == ModerationAction.Ban) {
                        const targetUser = await client.users.fetch(caseData.TargetUserId).catch(() => null);
                        if (targetUser)
                            interaction.guild.members.unban(
                                targetUser,
                                `Case #${caseData.CaseId} removed by ${interaction.user.username} (${interaction.user.id})`,
                            );
                        else
                            replyContent +=
                                "(Warning: could not remove the ban. You will have to remove the ban manually.)";
                    }

                    // Delete public mod log message
                    const publogChannel = await interaction.guild.channels
                        .fetch(guildSettings.PublicModLogChannelId)
                        .catch(() => null);
                    const publogMessage =
                        publogChannel && publogChannel.isTextBased()
                            ? await publogChannel.messages.fetch(caseData.PublicLogMsgId).catch(() => null)
                            : null;
                    if (publogMessage && publogMessage.deletable) await publogMessage.delete();

                    // Edit interaction reply
                    await interaction.editReply({ content: replyContent, embeds: [], components: [] });

                    // Logging
                    await client.dbUtils.sendGuildLog(interaction.guildId, {
                        content: `Case #${caseId} removed.`,
                        embeds: [
                            await client.dbUtils.generateCaseEmbedFromData(caseData, interaction.user, true, true),
                        ],
                    });

                    break;
                }
                case "no": {
                    await interaction.editReply({ content: "Case removal cancelled.", embeds: [], components: [] });
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
