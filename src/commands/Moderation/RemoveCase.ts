import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, userMention } from "discord.js";
import { ModerationAction } from "@prisma/client";
import { MeteoriumEmbedBuilder } from "../../util/MeteoriumEmbedBuilder";
import type { MeteoriumCommand } from "..";

export const Command: MeteoriumCommand = {
    InteractionData: new SlashCommandBuilder()
        .setName("removecase")
        .setDescription("Removes a user punishment/case")
        .addIntegerOption((option) =>
            option.setName("case").setDescription("The user punishment/case record to be removed").setRequired(true),
        ),
    async Callback(interaction, client) {
        if (!interaction.member.permissions.has("ViewAuditLog"))
            return await interaction.editReply({
                content: "You do not have permission to remove user punishments.",
            });

        const CaseId = interaction.options.getInteger("case", true);

        const Case = await client.Database.moderationCase.findFirst({
            where: { CaseId: CaseId, GuildId: interaction.guildId },
        });
        if (Case == null) return await interaction.reply({ content: `Case ${CaseId} does not exist.` });

        const TargetUser = await client.users.fetch(Case.TargetUserId).catch(() => null);

        const ActionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId("yes").setLabel("Yes").setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId("no").setLabel("No").setStyle(ButtonStyle.Danger),
        );

        const ConfirmationEmbed = new MeteoriumEmbedBuilder()
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
                { name: "Reason", value: Case.Reason },
            )
            .setImage(Case.AttachmentProof != "" ? Case.AttachmentProof : null)
            .setFooter({ text: `Id: ${Case.TargetUserId}` })
            .setTimestamp()
            .setColor("Red");

        if (Case.Action == ModerationAction.Mute)
            ConfirmationEmbed.addFields([{ name: "Duration", value: Case.Duration }]);

        const ConfirmationInteractionResult = await interaction.reply({
            content: "Are you sure you want to remove this punishment?",
            components: [ActionRow],
            embeds: [ConfirmationEmbed],
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
                    const SuccessDeleteEmbed = new MeteoriumEmbedBuilder()
                        .setTitle("Case removed")
                        .setDescription(`Case ${CaseId} removed.`)
                        .setColor("Green");

                    await client.Database.moderationCase.delete({ where: { GlobalCaseId: Case.GlobalCaseId } });
                    if (Case.Action == ModerationAction.Mute) {
                        const GuildUser = await interaction.guild.members.fetch(Case.TargetUserId).catch(() => null);
                        if (GuildUser)
                            await GuildUser.timeout(
                                null,
                                `Case ${CaseId} removed by ${interaction.user.username} (${interaction.user.id})`,
                            );
                    } else if (Case.Action == ModerationAction.Ban)
                        await interaction.guild.members.unban(
                            Case.TargetUserId,
                            `Case ${CaseId} removed by ${interaction.user.username} (${interaction.user.id})`,
                        );
                    else if (Case.Action == ModerationAction.TempBan) {
                        await interaction.guild.members.unban(
                            Case.TargetUserId,
                            `Case ${CaseId} removed by ${interaction.user.username} (${interaction.user.id})`,
                        );
                        const ATB = await client.Database.activeTempBans.findFirst({
                            where: { GlobalCaseId: Case.GlobalCaseId },
                        });
                        if (ATB)
                            await client.Database.activeTempBans.delete({
                                where: { ActiveTempBanId: ATB.ActiveTempBanId },
                            });
                    }

                    await interaction.editReply({ content: "", embeds: [SuccessDeleteEmbed], components: [] });

                    const GuildSetting = await client.Database.guild.findUnique({
                        where: { GuildId: interaction.guild.id },
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
                                                .setTitle("Confirmed user case/punishment record removal")
                                                .setFields([
                                                    {
                                                        name: "Remover",
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
                                                    { name: "Reason", value: Case.Reason },
                                                    {
                                                        name: "Proof",
                                                        value: Case.AttachmentProof ? Case.AttachmentProof : "N/A",
                                                    },
                                                ])
                                                .setImage(Case.AttachmentProof != "" ? Case.AttachmentProof : null)
                                                .setColor("Red"),
                                        ],
                                    });
                            })
                            .catch(() => null);
                    break;
                }
                case "no": {
                    await interaction.editReply({
                        content: "Cancelled user punishment/case record removal.",
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

        return;
    },
};
