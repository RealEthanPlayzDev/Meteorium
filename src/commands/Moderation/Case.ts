import { SlashCommandBuilder } from "discord.js";
import { MeteoriumEmbedBuilder } from "../../util/MeteoriumEmbedBuilder";
import type { MeteoriumCommand } from "..";

export const Command: MeteoriumCommand = {
    InteractionData: new SlashCommandBuilder()
        .setName("case")
        .setDescription("Views a user's case/punishment record")
        .addIntegerOption((option) =>
            option.setName("case").setDescription("The case id for the case to be viewed").setRequired(true),
        ),
    async Callback(interaction, client) {
        if (!interaction.member.permissions.has("ViewAuditLog"))
            return await interaction.editReply({
                content: "You do not have permission to view a user's punishment/case.",
            });

        const CaseId = interaction.options.getInteger("case", true);
        const Case = await client.Database.moderationCase.findUnique({
            where: { CaseId: CaseId },
        });
        if (Case == null)
            return await interaction.reply({
                content: `Case ${CaseId} does not exist.`,
            });

        const TargetUser = await client.users.fetch(Case.TargetUserId).catch(() => null);

        return await interaction.reply({
            embeds: [
                new MeteoriumEmbedBuilder(undefined, interaction.user)
                    .setAuthor({
                        name: `Case: #${CaseId} | ${Case.Action} | ${
                            TargetUser != null ? TargetUser.username : Case.TargetUserId
                        }`,
                        iconURL: TargetUser != null ? TargetUser.displayAvatarURL({ extension: "png" }) : undefined,
                    })
                    .addFields(
                        { name: "User", value: `<@${Case.TargetUserId}>` },
                        {
                            name: "Moderator",
                            value: `<@${Case.ModeratorUserId}>`,
                        },
                        { name: "Reason", value: Case.Reason },
                    )
                    .setImage(Case.AttachmentProof == "" ? null : Case.AttachmentProof)
                    .setFooter({ text: `Id: ${Case.TargetUserId}` })
                    .setTimestamp()
                    .setColor("Red"),
            ],
        });
    },
};