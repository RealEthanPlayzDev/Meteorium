import { ModerationAction, ModerationCase } from "@prisma/client";
import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import type { MeteoriumCommand } from "..";
import { MeteoriumEmbedBuilder } from "../../util/MeteoriumEmbedBuilder";

export const Command: MeteoriumCommand = {
    InteractionData: new SlashCommandBuilder()
        .setName("punishments")
        .setDescription("List all moderation cases/punishments a user has")
        .addUserOption((option) => option.setName("user").setDescription("The user").setRequired(true)),
    async Callback(interaction, client) {
        if (!interaction.member.permissions.has("ViewAuditLog"))
            return await interaction.editReply({
                content: "You do not have permission to view user punishments.",
            });

        const User = interaction.options.getUser("user", true);
        if (User.bot)
            return await interaction.reply({
                content: "Bots cannot be moderated, they can't have any moderation records.",
            });

        await interaction.deferReply();

        const Punishments = await client.Database.moderationCase.findMany({
            where: { TargetUserId: User.id, GuildId: interaction.guildId },
            orderBy: [{ CaseId: "desc" }],
        });

        let TotalKick = 0,
            TotalWarn = 0,
            TotalBan = 0,
            TotalMute = 0;

        if (Punishments.length == 0) {
            return await interaction.editReply({
                embeds: [
                    new MeteoriumEmbedBuilder()
                        .setAuthor({
                            name: User.username,
                            iconURL: User.displayAvatarURL({ extension: "png" }),
                        })
                        .setDescription("This user has no recorded punishments/cases.")
                        .setTimestamp()
                        .setNormalColor(),
                ],
            });
        } else {
            const PunishmentPages: ModerationCase[][] = [[]];
            for (let i = 0; i < Punishments.length; i++) {
                const Case = Punishments[i]!;
                if ((i + 1) % 10 == 0) PunishmentPages.push([]);
                PunishmentPages.at(-1)!.push(Case);
                switch (Case.Action) {
                    case ModerationAction.Ban: {
                        TotalBan++;
                        break;
                    }
                    case ModerationAction.TempBan: {
                        TotalBan++;
                        break;
                    }
                    case ModerationAction.Kick: {
                        TotalKick++;
                        break;
                    }
                    case ModerationAction.Mute: {
                        TotalMute++;
                        break;
                    }
                    case ModerationAction.Warn: {
                        TotalWarn++;
                        break;
                    }
                    default:
                        break;
                }
            }

            const GeneratePageEmbed = (index: number) => {
                if (PunishmentPages[index] == undefined) throw Error("invalid page index");
                return new MeteoriumEmbedBuilder()
                    .setAuthor({
                        name: User.username,
                        iconURL: User.displayAvatarURL({ extension: "png" }),
                    })
                    .setFields([
                        ...PunishmentPages[index]!.map((Case) => ({
                            name: `Case ${Case.CaseId} - ${Case.Action}`,
                            value: Case.Reason,
                        })),
                    ])
                    .setFooter({
                        text: `${
                            PunishmentPages.length > 1 ? `Page ${index + 1}/${PunishmentPages.length} | ` : ""
                        }Warned: ${TotalWarn} | Muted: ${TotalMute} | Kicked: ${TotalKick} | Banned: ${TotalBan}`,
                    })
                    .setNormalColor();
            };

            const GenerateActionRow = (index: number) => {
                return new ActionRowBuilder<ButtonBuilder>().addComponents([
                    new ButtonBuilder()
                        .setCustomId(String(index - 1))
                        .setLabel("Previous page")
                        .setEmoji({ name: "◀️" })
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(index <= 0),
                    new ButtonBuilder()
                        .setCustomId(String(index + 1))
                        .setLabel("Next page")
                        .setEmoji({ name: "▶️" })
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(index < 0 || index == PunishmentPages.length - 1),
                ]);
            };

            const GenerateMessageOptions = (index: number) => ({
                embeds: [GeneratePageEmbed(index)],
                components: PunishmentPages.length > 1 ? [GenerateActionRow(index)] : undefined,
                fetchReply: true,
            });

            const InitialSendResult = await interaction.editReply(GenerateMessageOptions(0));
            if (PunishmentPages.length <= 1) return;

            const ResultCollector = InitialSendResult.createMessageComponentCollector({ idle: 150000 });
            ResultCollector.on("collect", async (result) => {
                if (result.user.id != interaction.user.id) {
                    await interaction.reply({
                        content: "You're not the one who requested this command!",
                        ephemeral: true,
                    });
                    return;
                }

                let Index = -1;
                try {
                    Index = Number(result.customId);
                } catch {}
                if (Index == -1) {
                    await interaction.reply({ content: "Invalid page index", ephemeral: true });
                    return;
                }

                await InitialSendResult.edit(GenerateMessageOptions(+Index));
            });
            ResultCollector.on("end", async () => {
                await interaction.editReply({ components: [GenerateActionRow(-1)] });
            });
        }
    },
};
