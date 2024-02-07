import { SlashCommandBuilder, userMention, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { MeteoriumEmbedBuilder } from "../../util/MeteoriumEmbedBuilder";
import { ModerationAction } from "@prisma/client";
import type { MeteoriumCommand } from "..";

export const Command: MeteoriumCommand = {
    InteractionData: new SlashCommandBuilder()
        .setName("editcase")
        .setDescription("Edit a user's case/punishment record")
        .addIntegerOption((option) =>
            option.setName("case").setDescription("The case id for the case to be viewed").setRequired(true),
        )
        .addStringOption((option) =>
            option.setName("reason").setDescription("The reason on why this case exists").setRequired(false),
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
        ),
    async Callback(interaction, client) {
        if (!interaction.member.permissions.has("Administrator"))
            return await interaction.reply({
                content: "You do not have permission to view a user's punishment/case.",
            });

        const NewReason = interaction.options.getString("reason", false) || undefined;
        const NewDuration = (await interaction.options.getString("duration", false)) || undefined;
        const NewAttachmentProof = interaction.options.getAttachment("proof", false) || undefined;
        const NewNotAppealable = interaction.options.getBoolean("notappealable", false) || undefined;
        const NewModeratorNote = interaction.options.getString("modnote", false) || undefined;
        const NewModeratorAttachment = interaction.options.getAttachment("modattach", false) || undefined;

        if (
            !NewReason &&
            !NewDuration &&
            !NewAttachmentProof &&
            !NewNotAppealable &&
            !NewModeratorNote &&
            !NewModeratorAttachment
        )
            return await interaction.reply({
                content: "There are no modified fields.",
                ephemeral: true,
            });

        const CaseId = interaction.options.getInteger("case", true);
        const Case = await client.Database.moderationCase.findFirst({
            where: { CaseId: CaseId, GuildId: interaction.guildId },
            include: { ModerationCaseHistory: { orderBy: { ModerationCaseHistoryId: "asc" } } },
        });
        if (Case == null)
            return await interaction.reply({
                content: `Case ${CaseId} does not exist.`,
            });

        const TargetUser = await client.users.fetch(Case.TargetUserId).catch(() => null);
        const ParsedCase = {
            Reason: Case.Reason,
            AttachmentProof: Case.AttachmentProof,
            Duration: Case.Duration,
            ModeratorNote: Case.ModeratorNote,
            ModeratorAttachment: Case.ModeratorAttachment,
            NotAppealable: Case.NotAppealable,
        };

        for (const edit of Case.ModerationCaseHistory) {
            ParsedCase.Reason = edit.Reason != null ? edit.Reason : ParsedCase.Reason;
            ParsedCase.AttachmentProof =
                edit.AttachmentProof != null ? edit.AttachmentProof : ParsedCase.AttachmentProof;
            ParsedCase.Duration = edit.Duration != null ? edit.Duration : ParsedCase.Duration;
            ParsedCase.ModeratorNote = edit.ModeratorNote != null ? edit.ModeratorNote : ParsedCase.ModeratorNote;
            ParsedCase.ModeratorAttachment =
                edit.ModeratorAttachment != null ? edit.ModeratorAttachment : ParsedCase.ModeratorAttachment;
            ParsedCase.NotAppealable = edit.NotAppealable != null ? edit.NotAppealable : ParsedCase.NotAppealable;
        }

        const OldCaseEmbed = new MeteoriumEmbedBuilder(undefined, interaction.user)
            .setAuthor({
                name: `Case: #${CaseId} | ${Case.Action} | ${
                    TargetUser != null ? TargetUser.username : Case.TargetUserId
                }`,
                iconURL: TargetUser != null ? TargetUser.displayAvatarURL({ extension: "png" }) : undefined,
            })
            .addFields(
                { name: "User", value: userMention(Case.TargetUserId) },
                {
                    name: "Moderator",
                    value: userMention(Case.ModeratorUserId),
                },
                { name: "Reason", value: ParsedCase.Reason },
                { name: "Moderator note", value: ParsedCase.ModeratorNote != "" ? ParsedCase.ModeratorNote : "N/A" },
            )
            .setImage(ParsedCase.AttachmentProof == "" ? null : ParsedCase.AttachmentProof)
            .setThumbnail(ParsedCase.ModeratorAttachment == "" ? null : ParsedCase.ModeratorAttachment)
            .setColor("Red");

        const EditedCaseEmbed = new MeteoriumEmbedBuilder(undefined, interaction.user)
            .setAuthor({
                name: `Case: #${CaseId} | ${Case.Action} | ${
                    TargetUser != null ? TargetUser.username : Case.TargetUserId
                }`,
                iconURL: TargetUser != null ? TargetUser.displayAvatarURL({ extension: "png" }) : undefined,
            })
            .addFields(
                { name: "User", value: userMention(Case.TargetUserId) },
                {
                    name: "Moderator",
                    value: userMention(Case.ModeratorUserId),
                },
                { name: "Reason", value: NewReason ? NewReason : ParsedCase.Reason },
                {
                    name: "Moderator note",
                    value: NewModeratorNote
                        ? NewModeratorNote
                        : ParsedCase.ModeratorNote != ""
                        ? ParsedCase.ModeratorNote
                        : "N/A",
                },
            )
            .setImage(
                NewAttachmentProof
                    ? NewAttachmentProof.url
                    : ParsedCase.AttachmentProof == ""
                    ? null
                    : ParsedCase.AttachmentProof,
            )
            .setThumbnail(
                NewModeratorAttachment
                    ? NewModeratorAttachment.url
                    : ParsedCase.ModeratorAttachment == ""
                    ? null
                    : ParsedCase.ModeratorAttachment,
            )
            .setColor("Red");

        if (Case.Action == ModerationAction.Ban) {
            OldCaseEmbed.addFields({ name: "Appealable", value: ParsedCase.NotAppealable ? "No" : "Yes" });
            EditedCaseEmbed.addFields({
                name: "Appealable",
                value: NewNotAppealable != null ? (NewNotAppealable ? "No" : "Yes") : Case.NotAppealable ? "No" : "Yes",
            });
        }

        if (Case.Action == ModerationAction.Mute || Case.Action == ModerationAction.TempBan) {
            OldCaseEmbed.addFields([{ name: "Duration", value: ParsedCase.Duration }]);
            EditedCaseEmbed.addFields([{ name: "Duration", value: NewDuration ? NewDuration : ParsedCase.Duration }]);
        }

        const ActionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId("yes").setLabel("Yes").setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId("no").setLabel("No").setStyle(ButtonStyle.Danger),
        );

        const ConfirmationInteractionResult = await interaction.reply({
            content: "Are you sure you want to edit this punishment?",
            components: [ActionRow],
            embeds: [OldCaseEmbed, EditedCaseEmbed],
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
                    const SuccessEditEmbed = new MeteoriumEmbedBuilder()
                        .setTitle("Case edited")
                        .setDescription(`Case ${CaseId} edited. (Edit #${Case.ModerationCaseHistory.length + 1})`)
                        .setColor("Green");

                    await client.Database.moderationCaseHistory.create({
                        data: {
                            GlobalCaseId: Case.GlobalCaseId,
                            Editor: interaction.user.id,
                            Reason: NewReason,
                            AttachmentProof: NewAttachmentProof ? NewAttachmentProof.url : undefined,
                            Duration: NewDuration,
                            ModeratorNote: NewModeratorNote,
                            ModeratorAttachment: NewModeratorAttachment ? NewModeratorAttachment.url : undefined,
                            NotAppealable: NewNotAppealable,
                        },
                    });

                    const LogEmbed = new MeteoriumEmbedBuilder(undefined, interaction.user)
                        .setAuthor({
                            name: `Case: #${Case.CaseId} | ${String(Case.Action).toLowerCase()} | ${
                                TargetUser != null ? TargetUser.username : Case.TargetUserId
                            }`,
                            iconURL: TargetUser != null ? TargetUser.displayAvatarURL({ extension: "png" }) : undefined,
                        })
                        .addFields(
                            { name: "User", value: userMention(Case.TargetUserId) },
                            {
                                name: "Moderator",
                                value: userMention(Case.ModeratorUserId),
                            },
                            { name: "Reason", value: NewReason ? NewReason : ParsedCase.Reason },
                        )
                        .setImage(
                            NewAttachmentProof
                                ? NewAttachmentProof.url
                                : ParsedCase.AttachmentProof == ""
                                ? null
                                : ParsedCase.AttachmentProof,
                        )
                        .setFooter({ text: `Id: ${Case.TargetUserId}` })
                        .setTimestamp()
                        .setColor("Red");

                    if (Case.Action == ModerationAction.Ban)
                        LogEmbed.addFields({
                            name: "Appealable",
                            value:
                                NewNotAppealable != null
                                    ? NewNotAppealable
                                        ? "No"
                                        : "Yes"
                                    : Case.NotAppealable
                                    ? "No"
                                    : "Yes",
                        });

                    if (Case.Action == ModerationAction.Mute || Case.Action == ModerationAction.TempBan)
                        LogEmbed.addFields([
                            { name: "Duration", value: NewDuration ? NewDuration : ParsedCase.Duration },
                        ]);

                    const GuildSetting = await client.Database.guild.findUnique({
                        where: { GuildId: interaction.guild.id },
                    });

                    let Content = "";
                    if (Case.PublicModLogMsgId != "" && GuildSetting && GuildSetting.PublicModLogChannelId != "") {
                        const Channel =
                            (await interaction.guild.channels.fetch(GuildSetting.PublicModLogChannelId)) || undefined;
                        const Message =
                            Channel && Channel.isTextBased()
                                ? await Channel.messages.fetch(Case.PublicModLogMsgId)
                                : undefined;
                        if (Message && Message.editable) await Message.edit({ embeds: [LogEmbed] });
                        else Content = "(Warning: could not edit public mod log message)";
                    }

                    await interaction.editReply({
                        content: Content,
                        embeds: [SuccessEditEmbed, LogEmbed],
                        components: [],
                    });

                    if (GuildSetting && GuildSetting.LoggingChannelId != "")
                        client.channels
                            .fetch(GuildSetting.LoggingChannelId)
                            .then(async (channel) => {
                                const ModUser = await interaction.client.users
                                    .fetch(Case.ModeratorUserId)
                                    .catch(() => null);
                                if (channel && channel.isTextBased())
                                    await channel.send({
                                        embeds: [
                                            new MeteoriumEmbedBuilder(undefined, interaction.user)
                                                .setTitle("Confirmed user case/punishment record editing")
                                                .setFields([
                                                    {
                                                        name: "Editor",
                                                        value: `${interaction.user.username} (${
                                                            interaction.user.id
                                                        }) (${userMention(interaction.user.id)})`,
                                                    },
                                                    {
                                                        name: "Case moderator",
                                                        value: ModUser
                                                            ? `${ModUser.username} (${ModUser.id}) (${userMention(
                                                                  ModUser.id,
                                                              )})`
                                                            : `${userMention(Case.ModeratorUserId)} (${
                                                                  Case.ModeratorUserId
                                                              })`,
                                                    },
                                                    {
                                                        name: "Offending user",
                                                        value: TargetUser
                                                            ? `${TargetUser.username} (${TargetUser.id}) (${userMention(
                                                                  TargetUser.id,
                                                              )})`
                                                            : `${userMention(Case.TargetUserId)} (${
                                                                  Case.TargetUserId
                                                              })`,
                                                    },
                                                    { name: "Action", value: String(Case.Action) },
                                                    {
                                                        name: "Reason",
                                                        value: NewReason ? NewReason : ParsedCase.Reason,
                                                    },
                                                    {
                                                        name: "Proof",
                                                        value: NewAttachmentProof
                                                            ? NewAttachmentProof.url
                                                            : ParsedCase.AttachmentProof != ""
                                                            ? ParsedCase.AttachmentProof
                                                            : "N/A",
                                                    },
                                                    {
                                                        name: "Appealable",
                                                        value:
                                                            Case.Action == ModerationAction.Ban
                                                                ? Case.NotAppealable
                                                                    ? "No"
                                                                    : "Yes"
                                                                : "Not applicable",
                                                    },
                                                    {
                                                        name: "Duration",
                                                        value:
                                                            Case.Action == ModerationAction.TempBan ||
                                                            Case.Action == ModerationAction.Mute
                                                                ? NewNotAppealable != null
                                                                    ? NewNotAppealable
                                                                        ? "No"
                                                                        : "Yes"
                                                                    : ParsedCase.NotAppealable
                                                                    ? "No"
                                                                    : "Yes"
                                                                : "Not applicable",
                                                    },
                                                    {
                                                        name: "Moderator note",
                                                        value: NewModeratorNote
                                                            ? NewModeratorNote
                                                            : ParsedCase.ModeratorNote != ""
                                                            ? ParsedCase.ModeratorNote
                                                            : "N/A",
                                                    },
                                                ])
                                                .setImage(
                                                    NewAttachmentProof
                                                        ? NewAttachmentProof.url
                                                        : ParsedCase.AttachmentProof == ""
                                                        ? null
                                                        : ParsedCase.AttachmentProof,
                                                )
                                                .setThumbnail(
                                                    NewModeratorAttachment
                                                        ? NewModeratorAttachment.url
                                                        : ParsedCase.ModeratorAttachment == ""
                                                        ? null
                                                        : ParsedCase.ModeratorAttachment,
                                                )
                                                .setColor("Red"),
                                        ],
                                    });
                            })
                            .catch(() => null);

                    break;
                }
                case "no": {
                    await interaction.editReply({
                        content: "Cancelled user punishment/case record editing.",
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
    },
};
