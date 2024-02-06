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
        });
        if (Case == null)
            return await interaction.reply({
                content: `Case ${CaseId} does not exist.`,
            });

        //const TargetUser = await client.users.fetch(Case.TargetUserId).catch(() => null);

        /*
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
                                        { name: "Reason", value: Case.Reason },
                                        { name: "Proof", value: Case.AttachmentProof ? Case.AttachmentProof : "N/A" },
                                        {
                                            name: "Appealable",
                                            value:
                                                Case.Action == ModerationAction.Ban
                                                    ? Case.NotAppealable
                                                        ? "No"
                                                        : "Yes"
                                                    : "Not applicable",
                                        },
                                        { name: "Moderator note", value: Case.ModeratorNote },
                                        {
                                            name: "Moderator attachment",
                                            value: Case.ModeratorAttachment != "" ? Case.ModeratorAttachment : "N/A",
                                        },
                                    ])
                                    .setImage(Case.AttachmentProof != "" ? Case.AttachmentProof : null)
                                    .setThumbnail(Case.ModeratorAttachment != "" ? Case.ModeratorAttachment : null),
                            ],
                        });
                })
                .catch(() => null);
        */

        const Embed = new MeteoriumEmbedBuilder(undefined, interaction.user)
            .setAuthor({
                name: `Case: #${CaseId} | ${Case.Action} | ${Case.TargetUserId}`,
                // iconURL: TargetUser != null ? TargetUser.displayAvatarURL({ extension: "png" }) : undefined,
            })
            .addFields(
                { name: "User", value: userMention(Case.TargetUserId) },
                {
                    name: "Moderator",
                    value: userMention(Case.ModeratorUserId),
                },
                { name: "Reason", value: Case.Reason },
                { name: "Moderator note", value: Case.ModeratorNote != "" ? Case.ModeratorNote : "" },
            )
            .setImage(Case.AttachmentProof == "" ? null : Case.AttachmentProof)
            .setThumbnail(Case.ModeratorAttachment == "" ? null : Case.ModeratorAttachment)
            .setColor("Red");

        if (Case.Action == ModerationAction.Ban)
            Embed.addFields({ name: "Appealable", value: Case.NotAppealable ? "No" : "Yes" });

        return await interaction.reply({
            embeds: [Embed],
        });
    },
};
