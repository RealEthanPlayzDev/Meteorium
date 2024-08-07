import { PermissionFlagsBits, SlashCommandBuilder, userMention, time } from "discord.js";
import { GuildFeatures } from "@prisma/client";
import type { MeteoriumChatCommand } from "../../index.js";

export const Command: MeteoriumChatCommand = {
    interactionData: new SlashCommandBuilder()
        .setName("case")
        .setDescription("Gives information about a recorded moderation case")
        .addNumberOption((option) =>
            option.setName("caseid").setDescription("The id of the case you want to view").setRequired(true),
        )
        .addNumberOption((option) =>
            option
                .setName("historylevel")
                .setDescription("The history level, set to 0 to view the original case")
                .setRequired(false),
        )
        .addBooleanOption((option) =>
            option
                .setName("ephemeral")
                .setDescription("If true, response will be shown only to you")
                .setRequired(false),
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ViewAuditLog)
        .setDMPermission(false),
    requiredFeature: GuildFeatures.Moderation,
    async callback(interaction, client) {
        const caseId = interaction.options.getNumber("caseid", true);
        const historyLevel = interaction.options.getNumber("historylevel", false) || undefined;
        const ephemeral = interaction.options.getBoolean("ephemeral", false) || false;

        // Defer the reply
        await interaction.deferReply({ ephemeral: ephemeral });

        // Get case data
        const embed = await client.dbUtils.generateCaseEmbedFromCaseId(
            interaction.guildId,
            caseId,
            interaction.user,
            true,
            historyLevel,
        );
        if (!embed) return await interaction.editReply("The case you specified doesn't exist.");

        // Logging
        await client.dbUtils.sendGuildLog(interaction.guildId, {
            content: `Case #${caseId} viewed.`,
            embeds: [embed],
        });

        return await interaction.editReply({ embeds: [embed] });
    },
};
