import { ModerationAction } from "@prisma/client";
import { SlashCommandBuilder, userMention } from "discord.js";
import type { MeteoriumCommand } from "..";
import { MeteoriumEmbedBuilder } from "../../util/MeteoriumEmbedBuilder";

export const Command: MeteoriumCommand = {
    InteractionData: new SlashCommandBuilder()
        .setName("createcase")
        .setDescription("Creates a new moderation case")
        .addStringOption((option) =>
            option
                .setName("action")
                .setDescription("The action moderator took")
                .setRequired(true)
                .addChoices(
                    { name: "ban", value: "ban" },
                    { name: "unban", value: "unban" },
                    { name: "kick", value: "kick" },
                    { name: "mute", value: "mute" },
                    { name: "warn", value: "warn" },
                    { name: "tempban", value: "tempban" },
                ),
        )
        .addUserOption((option) =>
            option.setName("user").setDescription("The user that caused this case").setRequired(true),
        )
        .addStringOption((option) =>
            option.setName("reason").setDescription("The reason on why this case exists").setRequired(true),
        )
        .addUserOption((option) =>
            option
                .setName("moderator")
                .setDescription("The moderator who took action against user, if empty defaults to you")
                .setRequired(false),
        )
        .addStringOption((option) =>
            option.setName("duration").setDescription("The duration of the temporary ban/mute").setRequired(false),
        )
        .addAttachmentOption((option) =>
            option
                .setName("proof")
                .setDescription("An media containing proof to prove the reason valid")
                .setRequired(false),
        )
        .addBooleanOption((option) =>
            option
                .setName("notappealable")
                .setDescription("If true, this case cannot be appealed (bans only)")
                .setRequired(false),
        )
        .addStringOption((option) =>
            option.setName("modnote").setDescription("Interal moderator notes").setRequired(false),
        )
        .addAttachmentOption((option) =>
            option
                .setName("modattach")
                .setDescription("Internal media attachment only visible to moderators")
                .setRequired(false),
        )
        .addBooleanOption((option) =>
            option
                .setName("publog")
                .setDescription("Send the case details to the public moderation log channel")
                .setRequired(false),
        ),
    async Callback(interaction, client) {
        if (!interaction.member.permissions.has("ViewAuditLog"))
            return await interaction.reply({
                content: "You do not have permission to manually add cases in this server.",
            });

        const Moderator = interaction.options.getUser("moderator", false) || interaction.user;
        const User = interaction.options.getUser("user", true);
        const ActionStr = interaction.options.getString("action", true);
        const Reason = interaction.options.getString("reason", true);
        const Duration = (await interaction.options.getString("duration", false)) || undefined;
        const AttachmentProof = interaction.options.getAttachment("proof", false);
        const NotAppealable = interaction.options.getBoolean("notappealable", false) || false;
        const ModeratorNote = interaction.options.getString("modnote", false) || "";
        const ModeratorAttachment = interaction.options.getAttachment("modattach", false);
        const SendInPublicModLog = interaction.options.getBoolean("publog", false) || false;
        const GuildSchema = (await client.Database.guild.findUnique({ where: { GuildId: interaction.guildId } }))!;

        if (Moderator.bot) return await interaction.reply({ content: "Moderator can't be a bot!", ephemeral: true });
        if (User.bot)
            return await interaction.reply({ content: "Moderators can't take action against bots!", ephemeral: true });

        let Action: ModerationAction = ModerationAction.Warn;
        switch (ActionStr) {
            case "ban": {
                Action = ModerationAction.Ban;
                break;
            }
            case "unban": {
                Action = ModerationAction.Unban;
                break;
            }
            case "kick": {
                Action = ModerationAction.Kick;
                break;
            }
            case "mute": {
                Action = ModerationAction.Mute;
                break;
            }
            case "warn": {
                Action = ModerationAction.Warn;
                break;
            }
            case "tempban": {
                Action = ModerationAction.TempBan;
                break;
            }
            default: {
                throw new Error("CreateCase switch statement reached impossible conclusion");
            }
        }

        if ((Action == ModerationAction.Mute || Action == ModerationAction.TempBan) && !Duration)
            interaction.reply({ content: "You need to specify the duration.", ephemeral: true });

        await client.Database.guild.update({
            where: { GuildId: interaction.guildId },
            data: { CurrentCaseId: GuildSchema.CurrentCaseId + 1 },
        });
        const CaseResult = await client.Database.moderationCase.create({
            data: {
                CaseId: GuildSchema.CurrentCaseId + 1,
                Action: Action,
                TargetUserId: User.id,
                ModeratorUserId: Moderator.id,
                GuildId: interaction.guildId,
                Reason: Reason,
                Duration: Action == ModerationAction.Mute || Action == ModerationAction.TempBan ? Duration : undefined,
                AttachmentProof: AttachmentProof ? AttachmentProof.url : "",
                NotAppealable: Action == ModerationAction.Ban ? NotAppealable : undefined,
                ModeratorNote: ModeratorNote,
                ModeratorAttachment: ModeratorAttachment ? ModeratorAttachment.url : "",
            },
        });

        const LogEmbed = new MeteoriumEmbedBuilder(undefined, interaction.user)
            .setAuthor({
                name: `Case: #${CaseResult.CaseId} | ${ActionStr} | ${User.username}`,
                iconURL: User.displayAvatarURL({ extension: "png" }),
            })
            .addFields(
                { name: "User", value: userMention(User.id) },
                {
                    name: "Moderator",
                    value: userMention(Moderator.id),
                },
                { name: "Reason", value: Reason },
            )
            .setImage(AttachmentProof ? AttachmentProof.url : null)
            .setFooter({ text: `Id: ${User.id}` })
            .setTimestamp()
            .setColor("Red");

        const PublicModLogChannel = await interaction.guild.channels
            .fetch(GuildSchema.PublicModLogChannelId)
            .catch(() => null);
        let PublicModLogMsgId = "";
        if (PublicModLogChannel && PublicModLogChannel.isTextBased())
            PublicModLogMsgId = (await PublicModLogChannel.send({ embeds: [LogEmbed] })).id;

        if (PublicModLogMsgId != "")
            await client.Database.moderationCase.update({
                where: { GlobalCaseId: CaseResult.GlobalCaseId },
                data: { PublicModLogMsgId: PublicModLogMsgId },
            });

        const GuildSetting = await client.Database.guild.findUnique({ where: { GuildId: interaction.guild.id } });
        if (GuildSetting && GuildSetting.LoggingChannelId != "")
            client.channels
                .fetch(GuildSetting.LoggingChannelId)
                .then(async (channel) => {
                    if (channel && channel.isTextBased())
                        await channel.send({
                            embeds: [
                                new MeteoriumEmbedBuilder(undefined, interaction.user)
                                    .setTitle("Moderation action (create case)")
                                    .setFields([
                                        { name: "Case id", value: String(CaseResult.CaseId) },
                                        {
                                            name: "Moderator",
                                            value: `${Moderator.username} (${Moderator.id}) (${userMention(
                                                Moderator.id,
                                            )})`,
                                        },
                                        {
                                            name: "Offending user",
                                            value: `${User.username} (${User.id}) (${userMention(User.id)})`,
                                        },
                                        { name: "Action", value: ActionStr },
                                        { name: "Reason", value: Reason },
                                        { name: "Proof", value: AttachmentProof ? AttachmentProof.url : "N/A" },
                                        { name: "Moderator note", value: ModeratorNote },
                                        {
                                            name: "Moderator attachment",
                                            value: ModeratorAttachment ? ModeratorAttachment.url : "N/A",
                                        },
                                    ])
                                    .setImage(AttachmentProof ? AttachmentProof.url : null)
                                    .setThumbnail(ModeratorAttachment ? ModeratorAttachment.url : null),
                            ],
                        });
                })
                .catch(() => null);

        return await interaction.reply({
            content:
                SendInPublicModLog && PublicModLogChannel != null && PublicModLogChannel.isTextBased()
                    ? undefined
                    : "(Warning: could not send log message to the public mod log channel)",
            embeds: [LogEmbed],
            ephemeral: GuildSchema?.PublicModLogChannelId != "",
        });
    },
};
