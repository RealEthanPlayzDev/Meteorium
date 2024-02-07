import { ModerationAction } from "@prisma/client";
import ms from "ms";
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
        )
        .addAttachmentOption((option) =>
            option
                .setName("modattach")
                .setDescription("Internal media attachment only visible to moderators")
                .setRequired(false),
        )
        .addStringOption((option) =>
            option
                .setName("delmsghistory")
                .setDescription("Delete message history time")
                .setRequired(false)
                .setAutocomplete(true),
        ),
    async Callback(interaction, client) {
        if (!interaction.member.permissions.has("BanMembers"))
            return await interaction.reply({
                content: "You do not have permission to ban users from this server.",
            });

        const User = interaction.options.getUser("user", true);
        const Reason = interaction.options.getString("reason", true);
        const AttachmentProof = interaction.options.getAttachment("proof", false);
        const NotAppealable = interaction.options.getBoolean("notappealable", false) || false;
        const ModeratorNote = interaction.options.getString("modnote", false) || "";
        const ModeratorAttachment = interaction.options.getAttachment("modattach", false);
        const DeleteMessageHistory = interaction.options.getString("delmsghistory", false) || undefined;
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

        await interaction.deferReply({ ephemeral: GuildSchema?.PublicModLogChannelId != "" });

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
                ModeratorAttachment: ModeratorAttachment ? ModeratorAttachment.url : "",
                NotAppealable: NotAppealable,
            },
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

        const AppealEmbed = new MeteoriumEmbedBuilder(undefined, User)
            .setTitle(NotAppealable ? "You cannot appeal your ban." : "Your ban is appealable.")
            .setDescription(
                NotAppealable
                    ? "Your ban was marked unappealable, you have been permanently banned."
                    : GuildSchema.BanAppealLink != ""
                    ? "You can appeal your ban, use the following link below to appeal."
                    : "You can appeal your ban, contact a server moderator.",
            );

        if (NotAppealable) AppealEmbed.setErrorColor();
        else {
            AppealEmbed.setColor("Yellow");
            if (GuildSchema.BanAppealLink != "")
                AppealEmbed.addFields([{ name: "Ban appeal link", value: GuildSchema.BanAppealLink }]);
        }

        try {
            const DirectMessageChannnel = await User.createDM();
            await DirectMessageChannnel.send({ embeds: [LogEmbed, AppealEmbed] });
        } catch (err) {
            client.Logging.GetNamespace("Moderation/Ban").warn(`Could not dm ${User.id}\n${err}`);
        }

        const DelMsgHistoryParsed = DeleteMessageHistory ? ms(DeleteMessageHistory) * 1000 : undefined;
        await interaction.guild.members.ban(User, {
            reason: `Case ${CaseResult.CaseId} by ${interaction.user.username} (${interaction.user.id}): ${Reason}`,
            deleteMessageSeconds: DelMsgHistoryParsed,
        });

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
                                        { name: "Moderator note", value: ModeratorNote != "" ? ModeratorNote : "N/A" },
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

        return await interaction.editReply({
            content:
                PublicModLogChannel != null && PublicModLogChannel.isTextBased()
                    ? undefined
                    : "(Warning: could not send log message to the public mod log channel)",
            embeds: [LogEmbed],
        });
    },
    async Autocomplete(interaction) {
        const Focus = interaction.options.getFocused(true);
        if (Focus.name == "delmsghistory")
            return await interaction.respond([
                { name: "1 day", value: "1d" },
                { name: "2 days", value: "2d" },
                { name: "3 days", value: "3d" },
                { name: "4 days", value: "4d" },
                { name: "5 days", value: "5d" },
                { name: "6 days", value: "6d" },
                { name: "7 days", value: "7d" },
            ]);
        return await interaction.respond([]);
    },
};
