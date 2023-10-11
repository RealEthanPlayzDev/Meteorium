import { ModerationAction } from "@prisma/client";
import { SlashCommandBuilder } from "discord.js";
import type { MeteoriumCommand } from "..";
import { MeteoriumEmbedBuilder } from "../../util/MeteoriumEmbedBuilder";

export const Command: MeteoriumCommand = {
    InteractionData: new SlashCommandBuilder()
        .setName("warn")
        .setDescription("Warns someone inside this server and create a new case regarding it")
        .addUserOption((option) => option.setName("user").setDescription("The user to be warned").setRequired(true))
        .addStringOption((option) =>
            option.setName("reason").setDescription("The reason on why the user was warned").setRequired(true),
        )
        .addAttachmentOption((option) =>
            option
                .setName("proof")
                .setDescription("An media containing proof to prove the reason valid")
                .setRequired(false),
        ),
    async Callback(interaction, client) {
        // TODO: Warning users shouldn't be attached to viewing audit logs, find a good permission for this
        if (!interaction.member.permissions.has("ManageMessages"))
            return await interaction.editReply({
                content: "You do not have permission to warn users from this server.",
            });

        const User = interaction.options.getUser("user", true);
        const Reason = interaction.options.getString("reason", true);
        const AttachmentProof = interaction.options.getAttachment("proof", false);

        const CaseResult = await client.Database.moderationCase.create({
            data: {
                Action: ModerationAction.Warn,
                TargetUserId: User.id,
                ModeratorUserId: interaction.user.id,
                Reason: Reason,
                AttachmentProof: AttachmentProof ? AttachmentProof.url : "",
            },
        });

        return await interaction.reply({
            embeds: [
                new MeteoriumEmbedBuilder(undefined, interaction.user)
                    .setAuthor({
                        name: `Case: #${CaseResult.CaseId} | warn | ${User.username}`,
                        iconURL: User.displayAvatarURL({ extension: "png" }),
                    })
                    .addFields(
                        { name: "User", value: `<@${User.id}>` },
                        {
                            name: "Moderator",
                            value: `<@${interaction.user.id}>`,
                        },
                        { name: "Reason", value: Reason },
                    )
                    .setImage(AttachmentProof ? AttachmentProof.url : null)
                    .setFooter({ text: `Id: ${User.id}` })
                    .setTimestamp()
                    .setColor("Red"),
            ],
        });
    },
};
