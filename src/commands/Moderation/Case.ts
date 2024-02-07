import { SlashCommandBuilder, userMention } from "discord.js";
import { MeteoriumEmbedBuilder } from "../../util/MeteoriumEmbedBuilder";
import { ModerationAction } from "@prisma/client";
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
            return await interaction.reply({
                content: "You do not have permission to view a user's punishment/case.",
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

        const GuildSetting = await client.Database.guild.findUnique({ where: { GuildId: interaction.guild.id } });
        if (GuildSetting && GuildSetting.LoggingChannelId != "")
            client.channels
                .fetch(GuildSetting.LoggingChannelId)
                .then(async (channel) => {
                    const ModUser = await interaction.client.users.fetch(Case.ModeratorUserId).catch(() => null);
                    if (channel && channel.isTextBased())
                        await channel.send({
                            embeds: [
                                new MeteoriumEmbedBuilder(undefined, interaction.user)
                                    .setTitle("View case")
                                    .setFields([
                                        {
                                            name: "Detail requester (viewer)",
                                            value: `${interaction.user.username} (${
                                                interaction.user.id
                                            }) (${userMention(interaction.user.id)})`,
                                        },
                                        {
                                            name: "Case moderator",
                                            value: ModUser
                                                ? `${ModUser.username} (${ModUser.id}) (${userMention(ModUser.id)})`
                                                : `<@${Case.ModeratorUserId}> (${Case.ModeratorUserId})`,
                                        },
                                        {
                                            name: "Offending user",
                                            value: TargetUser
                                                ? `${TargetUser.username} (${TargetUser.id}) (${userMention(
                                                      TargetUser.id,
                                                  )})`
                                                : `${userMention(Case.TargetUserId)} (${Case.TargetUserId})`,
                                        },
                                        { name: "Action", value: String(Case.Action) },
                                        { name: "Reason", value: ParsedCase.Reason },
                                        {
                                            name: "Proof",
                                            value: ParsedCase.AttachmentProof ? Case.AttachmentProof : "N/A",
                                        },
                                        {
                                            name: "Appealable",
                                            value:
                                                Case.Action == ModerationAction.Ban
                                                    ? ParsedCase.NotAppealable
                                                        ? "No"
                                                        : "Yes"
                                                    : "Not applicable",
                                        },
                                        {
                                            name: "Moderator note",
                                            value: ParsedCase.ModeratorNote != "" ? ParsedCase.ModeratorNote : "N/A",
                                        },
                                        {
                                            name: "Moderator attachment",
                                            value:
                                                ParsedCase.ModeratorAttachment != ""
                                                    ? ParsedCase.ModeratorAttachment
                                                    : "N/A",
                                        },
                                    ])
                                    .setImage(ParsedCase.AttachmentProof != "" ? ParsedCase.AttachmentProof : null)
                                    .setThumbnail(
                                        ParsedCase.ModeratorAttachment != "" ? ParsedCase.ModeratorAttachment : null,
                                    ),
                            ],
                        });
                })
                .catch(() => null);

        const Embed = new MeteoriumEmbedBuilder(undefined, interaction.user)
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

        if (Case.Action == ModerationAction.Ban)
            Embed.addFields({ name: "Appealable", value: ParsedCase.NotAppealable ? "No" : "Yes" });

        return await interaction.reply({
            embeds: [Embed],
        });
    },
};
