import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { ModerationAction } from "@prisma/client";
import { MeteoriumEmbedBuilder } from "../../util/MeteoriumEmbedBuilder";
import type { MeteoriumCommand } from "..";

export const Command: MeteoriumCommand = {
    InteractionData: new SlashCommandBuilder()
        .setName("removecase")
        .setDescription("Removes a user punishment/case")
        .addIntegerOption((option) =>
            option.setName("case").setDescription("The user punishment/case record to be removed").setRequired(true),
        ),
    async Callback(interaction, client) {
        if (!interaction.member.permissions.has("ViewAuditLog"))
            return await interaction.editReply({
                content: "You do not have permission to remove user punishments.",
            });

        const CaseId = interaction.options.getInteger("case", true);

        const Case = await client.Database.moderationCase.findUnique({ where: { CaseId: CaseId } });
        if (Case == null) return await interaction.reply({ content: `Case ${CaseId} does not exist.` });

        const ActionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId("yes").setLabel("Yes").setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId("no").setLabel("No").setStyle(ButtonStyle.Danger),
        );

        const ConfirmationEmbed = new MeteoriumEmbedBuilder()
            .setAuthor({
                name: `Case: #${Case.CaseId} | ${Case.Action} | ${Case.TargetUserId}`,
            })
            .addFields(
                { name: "User", value: `<@${Case.TargetUserId}>` },
                {
                    name: "Moderator",
                    value: `<@${Case.ModeratorUserId}>`,
                },
                { name: "Reason", value: Case.Reason },
            )
            .setImage(Case.AttachmentProof != "" ? Case.AttachmentProof : null)
            .setFooter({ text: `Id: ${Case.TargetUserId}` })
            .setTimestamp()
            .setColor("Red");

        if (Case.Action == ModerationAction.Mute)
            ConfirmationEmbed.addFields([{ name: "Duration", value: Case.MuteDuration }]);

        const ConfirmationInteractionResult = await interaction.reply({
            content: "Are you sure you want to remove this punishment?",
            components: [ActionRow],
            embeds: [ConfirmationEmbed],
            ephemeral: true,
            fetchReply: true,
        });

        const RowResultCollector = ConfirmationInteractionResult.createMessageComponentCollector({
            time: 60000,
            max: 1,
        });
        RowResultCollector.on("collect", async (result) => {
            switch (result.customId) {
                case "yes": {
                    const SuccessDeleteEmbed = new MeteoriumEmbedBuilder()
                        .setTitle("Case removed")
                        .setDescription(`Case ${CaseId} has been removed.`)
                        .setColor("Green");

                    const GuildUser = await interaction.guild.members.fetch(Case.TargetUserId);
                    if (Case.Action == ModerationAction.Mute)
                        await GuildUser.timeout(null, `Case ${CaseId} removed by ${interaction.user.id}`);
                    else if (Case.Action == ModerationAction.Ban)
                        await interaction.guild.members.unban(
                            Case.TargetUserId,
                            `Case ${CaseId} removed by ${interaction.user.id}`,
                        );

                    await interaction.editReply({ content: "", embeds: [SuccessDeleteEmbed], components: [] });
                    break;
                }
                case "no": {
                    await interaction.editReply({
                        content: "Cancelled user punishment/case record removal.",
                        embeds: [],
                        components: [],
                    });
                    break;
                }
                default:
                    break;
            }
        });
        RowResultCollector.on("end", async (result) => {
            if (result.size < 1)
                await interaction.editReply({ content: "Command timed out.", embeds: [], components: [] });
        });

        return;
    },
};
