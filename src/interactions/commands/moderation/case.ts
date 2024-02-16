import { PermissionFlagsBits, SlashCommandBuilder, userMention } from "discord.js";
import type { MeteoriumChatCommand } from "../../index.js";
import MeteoriumEmbedBuilder from "../../../classes/embedBuilder.js";
import { ModerationAction } from "@prisma/client";
import moment from "moment";

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
            option.setName("ephmeral").setDescription("If true, response will be shown only to you").setRequired(false),
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ViewAuditLog)
        .setDMPermission(false),
    async callback(interaction, client) {
        const caseId = interaction.options.getNumber("caseid", true);
        const historyLevel = interaction.options.getNumber("historylevel", false) || undefined;
        const ephmeral = interaction.options.getBoolean("ephmeral", false) || false;

        // Defer the reply
        await interaction.deferReply({ ephemeral: ephmeral });

        // Get case data
        const caseDb = await client.dbUtils.getCaseData(interaction.guildId, caseId, historyLevel);
        if (!caseDb) return await interaction.editReply("The case you specified doesn't exist.");

        // Get user datas
        const modUser = await client.users.fetch(caseDb.ModeratorUserId).catch(() => null);
        const targetUser = await client.users.fetch(caseDb.TargetUserId).catch(() => null);

        // Create embed
        const embed = new MeteoriumEmbedBuilder(interaction.user)
            .setAuthor({
                name: `Case: #${caseId} | ${caseDb.Action.toLowerCase()} | ${targetUser != null ? `${targetUser.username} (${targetUser.id})` : caseDb.TargetUserId}`,
                iconURL: targetUser != null ? targetUser.displayAvatarURL({ extension: "png", size: 256 }) : undefined,
            })
            .addFields([
                {
                    name: "Moderator",
                    value: `${userMention(caseDb.ModeratorUserId)} (${modUser != null ? `${modUser.username} - ${modUser.id}` : caseDb.ModeratorUserId})`,
                },
                {
                    name: "Target",
                    value: `${userMention(caseDb.TargetUserId)} (${targetUser != null ? `${targetUser.username} - ${targetUser.id}` : caseDb.TargetUserId})`,
                },
                { name: "Reason", value: caseDb.Reason },
            ])
            .setImage(caseDb.AttachmentProof != "" ? caseDb.AttachmentProof : null)
            .setThumbnail(caseDb.ModeratorAttachment != "" ? caseDb.ModeratorAttachment : null)
            .setColor("Yellow");

        // Action specific fields
        if (caseDb.Action == ModerationAction.Mute || caseDb.Action == ModerationAction.TempBan)
            embed.addFields([{ name: "Duration", value: caseDb.Duration }]);
        if (caseDb.Action == ModerationAction.Ban)
            embed.addFields([{ name: "Appealable", value: caseDb.NotAppealable ? "No" : "Yes" }]);

        // Remaining fields
        embed.addFields([
            { name: "Moderator note", value: caseDb.ModeratorNote != "" ? caseDb.ModeratorNote : "N/A" },
            { name: "Attachment proof", value: caseDb.AttachmentProof != "" ? caseDb.AttachmentProof : "N/A" },
            {
                name: "Moderator attachment",
                value: caseDb.ModeratorAttachment != "" ? caseDb.ModeratorAttachment : "N/A",
            },
            { name: "Removed", value: caseDb.Removed ? "Yes" : "No" },
            { name: "Created at", value: moment(caseDb.CreatedAt).format("DD-MM-YYYY hh:mm:ss:SSS A Z") },
        ]);

        return await interaction.editReply({ embeds: [embed] });
    },
};
