import { ModerationAction } from "@prisma/client";
import { SlashCommandBuilder, userMention } from "discord.js";
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
        const GuildUser = await interaction.guild.members.fetch(User).catch(() => null);
        const GuildSchema = (await client.Database.guild.findUnique({ where: { GuildId: interaction.guildId } }))!;

        if (Timeout < 1) return await interaction.reply({ content: "Invalid mute duration", ephemeral: true });
        if (Timeout >= ms("29d"))
            return await interaction.reply({
                content:
                    "It is not possible to mute a user longer than 29 days. Please specify a duration below 29 days.",
                ephemeral: true,
            });
        if (User.id == interaction.user.id)
            return await interaction.reply({ content: "You can't mute yourself!", ephemeral: true });
        if (User.bot) return await interaction.reply({ content: "You can't mute bots!", ephemeral: true });
        if (
            !GuildUser ||
            !GuildUser.moderatable ||
            GuildUser.roles.highest.position >= interaction.member.roles.highest.position
        )
            return interaction.reply({
                content: "You (or the bot) can't moderate this user due to lack of permission/hierachy.",
                ephemeral: true,
            });

        await client.Database.guild.update({
            where: { GuildId: interaction.guildId },
            data: { CurrentCaseId: GuildSchema.CurrentCaseId + 1 },
        });
        const CaseResult = await client.Database.moderationCase.create({
            data: {
                CaseId: GuildSchema.CurrentCaseId + 1,
                Action: ModerationAction.Mute,
                TargetUserId: User.id,
                ModeratorUserId: interaction.user.id,
                GuildId: interaction.guildId,
                Reason: Reason,
                AttachmentProof: AttachmentProof ? AttachmentProof.url : "",
                Duration: Duration,
                CreatedAt: new Date(),
            },
        });
        await GuildUser.timeout(
            Timeout,
            `Case ${CaseResult.CaseId} by ${interaction.user.username} (${interaction.user.id}): ${Reason}`,
        );

        const LogEmbed = new MeteoriumEmbedBuilder(undefined, interaction.user)
            .setAuthor({
                name: `Case: #${CaseResult.CaseId} | mute | ${User.username}`,
                iconURL: User.displayAvatarURL({ extension: "png" }),
            })
            .addFields(
                { name: "User", value: userMention(User.id) },
                {
                    name: "Moderator",
                    value: userMention(interaction.user.id),
                },
                { name: "Reason", value: Reason },
                { name: "Duration", value: Duration },
            )
            .setImage(AttachmentProof ? AttachmentProof.url : null)
            .setFooter({ text: `Id: ${User.id}` })
            .setTimestamp()
            .setColor("Red");

        const PublicModLogChannel = await interaction.guild.channels
            .fetch(GuildSchema.PublicModLogChannelId)
            .catch(() => null);
        if (PublicModLogChannel && PublicModLogChannel.isTextBased())
            await PublicModLogChannel.send({ embeds: [LogEmbed] });

        const GuildSetting = await client.Database.guild.findUnique({ where: { GuildId: interaction.guild.id } });
        if (GuildSetting && GuildSetting.LoggingChannelId != "")
            client.channels
                .fetch(GuildSetting.LoggingChannelId)
                .then(async (channel) => {
                    if (channel && channel.isTextBased())
                        await channel.send({
                            embeds: [
                                new MeteoriumEmbedBuilder(undefined, interaction.user)
                                    .setTitle("Moderation action")
                                    .setFields([
                                        { name: "Case id", value: String(CaseResult.CaseId) },
                                        {
                                            name: "Moderator",
                                            value: `${interaction.user.username} (${
                                                interaction.user.id
                                            }) (${userMention(interaction.user.id)})`,
                                        },
                                        {
                                            name: "Offending user",
                                            value: `${User.username} (${User.id}) (${userMention(User.id)})`,
                                        },
                                        { name: "Action", value: "Mute" },
                                        { name: "Reason", value: Reason },
                                        { name: "Duration", value: `${Duration} (${Timeout})` },
                                        { name: "Proof", value: AttachmentProof ? AttachmentProof.url : "N/A" },
                                    ])
                                    .setImage(AttachmentProof ? AttachmentProof.url : null),
                            ],
                        });
                })
                .catch(() => null);

        return await interaction.reply({
            content:
                PublicModLogChannel != null && PublicModLogChannel.isTextBased()
                    ? undefined
                    : "(Warning: could not send log message to the public mod log channel)",
            embeds: [LogEmbed],
            ephemeral: GuildSchema?.PublicModLogChannelId != "",
        });
    },
};
