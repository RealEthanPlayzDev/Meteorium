import { ModerationAction } from "@prisma/client";
import { SlashCommandBuilder } from "discord.js";
import ms from "ms";
import { MeteoriumEmbedBuilder } from "../../util/MeteoriumEmbedBuilder";
import type { MeteoriumCommand } from "..";

export const Command: MeteoriumCommand = {
    InteractionData: new SlashCommandBuilder()
        .setName("mute")
        .setDescription("Mutes someone inside this server and create a new case regarding it")
        .addUserOption((option) => option.setName("user").setDescription("The user to be muted").setRequired(true))
        .addStringOption((option) =>
            option.setName("reason").setDescription("The reason on why the user was muted").setRequired(true),
        )
        .addStringOption((option) =>
            option.setName("duration").setDescription("The duration of the mute").setRequired(true),
        )
        .addAttachmentOption((option) =>
            option
                .setName("proof")
                .setDescription("An media containing proof to prove the reason valid")
                .setRequired(false),
        ),
    async Callback(interaction, client) {
        if (!interaction.member.permissions.has("ManageMessages"))
            return await interaction.editReply({
                content: "You do not have permission to mute users from this server.",
            });

        const User = interaction.options.getUser("user", true);
        const Reason = interaction.options.getString("reason", true);
        const Duration = interaction.options.getString("duration", true);
        const AttachmentProof = interaction.options.getAttachment("proof", false);
        const Timeout = ms(Duration);
        const GuildUser = await interaction.guild.members.fetch(User);

        if (Timeout < 1) return await interaction.reply({ content: "Invalid mute duration", ephemeral: true });
        if (Timeout >= ms("29d"))
            return await interaction.reply({
                content:
                    "It is not possible to mute a user longer than 29 days. Please sepcify a duration below 29 days.",
                ephemeral: true,
            });
        if (User.id == interaction.user.id)
            return await interaction.reply({ content: "You can't mute yourself!", ephemeral: true });
        if (User.bot) return await interaction.reply({ content: "You can't mute bots!", ephemeral: true });
        if (!GuildUser.moderatable || GuildUser.roles.highest.position >= interaction.member.roles.highest.position)
            return interaction.reply({ content: "You can't moderate this user.", ephemeral: true });

        GuildUser.timeout(Timeout, `Moderation action carried by ${interaction.user.id}: ${Reason}`);
        const CaseResult = await client.Database.moderationCase.create({
            data: {
                Action: ModerationAction.Ban,
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
                        name: `Case: #${CaseResult.CaseId} | mute | ${User.username}`,
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
