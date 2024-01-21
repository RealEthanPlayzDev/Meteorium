import { ModerationAction } from "@prisma/client";
import { SlashCommandBuilder, userMention } from "discord.js";
import type { MeteoriumCommand } from "..";
import { MeteoriumEmbedBuilder } from "../../util/MeteoriumEmbedBuilder";

export const Command: MeteoriumCommand = {
    InteractionData: new SlashCommandBuilder()
        .setName("ban")
        .setDescription("Bans someone inside this server and create a new case regarding it")
        .addUserOption((option) => option.setName("user").setDescription("The user to be banned").setRequired(true))
        .addStringOption((option) =>
            option.setName("reason").setDescription("The reason on why the user was banned").setRequired(true),
        )
        .addAttachmentOption((option) =>
            option
                .setName("proof")
                .setDescription("An media containing proof to prove the reason valid")
                .setRequired(false),
        )
        .addBooleanOption((option) =>
            option.setName("notappealable").setDescription("If true, this case cannot be appealed").setRequired(false),
        )
        .addStringOption((option) =>
            option.setName("modnote").setDescription("Interal moderator notes").setRequired(false),
        ),
    async Callback(interaction, client) {
        if (!interaction.member.permissions.has("BanMembers"))
            return await interaction.editReply({
                content: "You do not have permission to ban users from this server.",
            });

        const User = interaction.options.getUser("user", true);
        const Reason = interaction.options.getString("reason", true);
        const AttachmentProof = interaction.options.getAttachment("proof", false);
        const NotAppealable = interaction.options.getBoolean("notappealable", false) || false;
        const ModeratorNote = interaction.options.getString("modnote", false) || "";
        const GuildUser = await interaction.guild.members.fetch(User).catch(() => null);
        const GuildSchema = (await client.Database.guild.findUnique({ where: { GuildId: interaction.guildId } }))!;

        if (User.id == interaction.user.id)
            return await interaction.reply({ content: "You can't ban yourself!", ephemeral: true });
        if (User.bot)
            return await interaction.reply({ content: "You can't ban bots! (do it manually)", ephemeral: true });
        if (
            GuildUser &&
            GuildUser.moderatable &&
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
                Action: ModerationAction.Ban,
                TargetUserId: User.id,
                ModeratorUserId: interaction.user.id,
                GuildId: interaction.guildId,
                Reason: Reason,
                AttachmentProof: AttachmentProof ? AttachmentProof.url : "",
                CreatedAt: new Date(),
                ModeratorNote: ModeratorNote,
                NotAppealable: NotAppealable,
            },
        });
        await interaction.guild.members.ban(User, {
            reason: `Case ${CaseResult.CaseId} by ${interaction.user.username} (${interaction.user.id}): ${Reason}`,
        });

        const LogEmbed = new MeteoriumEmbedBuilder(undefined, interaction.user)
            .setAuthor({
                name: `Case: #${CaseResult.CaseId} | ban | ${User.username}`,
                iconURL: User.displayAvatarURL({ extension: "png" }),
            })
            .addFields(
                { name: "User", value: userMention(User.id) },
                {
                    name: "Moderator",
                    value: userMention(interaction.user.id),
                },
                { name: "Reason", value: Reason },
                { name: "Appealable", value: NotAppealable ? "No" : "Yes" },
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
                                        { name: "Action", value: "Ban" },
                                        { name: "Reason", value: Reason },
                                        { name: "Proof", value: AttachmentProof ? AttachmentProof.url : "N/A" },
                                        { name: "Appealable", value: NotAppealable ? "No" : "Yes" },
                                        { name: "Moderator note", value: ModeratorNote },
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
