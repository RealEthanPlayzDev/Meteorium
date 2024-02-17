import { PermissionFlagsBits, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { ModerationAction } from "@prisma/client";
import type { MeteoriumChatCommand } from "../../index.js";
import MeteoriumEmbedBuilder from "../../../classes/embedBuilder.js";
import { CaseData } from "../../../classes/dbUtils.js";

export const Command: MeteoriumChatCommand = {
    interactionData: new SlashCommandBuilder()
        .setName("cases")
        .setDescription("Gives information about a recorded moderation case")
        .addUserOption((option) =>
            option
                .setName("user")
                .setDescription("The target user you want to check for recorded cases")
                .setRequired(false),
        )
        .addBooleanOption((option) =>
            option
                .setName("inclremoved")
                .setDescription("If true, removed cases will also be included")
                .setRequired(false),
        )
        .addBooleanOption((option) =>
            option
                .setName("ephemeral")
                .setDescription("If true, response will be shown only to you")
                .setRequired(false),
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ViewAuditLog)
        .setDMPermission(false),
    async callback(interaction, client) {
        const user = interaction.options.getUser("user", false) || undefined;
        const ephemeral = interaction.options.getBoolean("ephemeral", false) || false;

        // Defer reply
        const sentReplyMsg = await interaction.deferReply({ ephemeral: ephemeral, fetchReply: true });

        // Get cases
        const cases = await client.dbUtils.getCasesWithLatestHistory(interaction.guildId, user?.id);

        // Check if theres no cases to show
        if (cases.length == 0)
            return interaction.editReply({
                embeds: [
                    new MeteoriumEmbedBuilder(interaction.user)
                        .setAuthor({
                            name: `Cases | ${user ? `${user.username} (${user.id})` : interaction.guild.name}`,
                            iconURL: user
                                ? user.displayAvatarURL({ extension: "png", size: 256 })
                                : interaction.guild.iconURL({ extension: "png", size: 256 }) || undefined,
                        })
                        .setDescription(
                            user
                                ? "This user has no recorded moderation cases"
                                : "This server has no recorded moderation cases",
                        ),
                ],
            });

        // Create paged cases array
        const pagedCases: Array<Array<CaseData>> = [];
        let warns = 0;
        let mutes = 0;
        let kicks = 0;
        let tempBans = 0;
        let bans = 0;
        let unbans = 0;
        pagedCases.push([]);
        for (let index = 0; index < cases.length; index++) {
            const caseData = cases[index];
            if ((index + 1) % 10 == 0) pagedCases.push([]);
            pagedCases.at(-1)!.push(caseData);

            switch (caseData.Action) {
                case ModerationAction.Warn: {
                    warns += 1;
                    break;
                }
                case ModerationAction.Mute: {
                    mutes += 1;
                    break;
                }
                case ModerationAction.Kick: {
                    kicks += 1;
                    break;
                }
                case ModerationAction.TempBan: {
                    tempBans += 1;
                    break;
                }
                case ModerationAction.Ban: {
                    bans += 1;
                    break;
                }
                case ModerationAction.Unban: {
                    unbans += 1;
                    break;
                }
                default: {
                    throw new Error("impossible switch statement reach");
                }
            }
        }

        // Function to create a embed containing cases based on current pagination index
        function createPageEmbed(index: number) {
            if (!pagedCases[index]) throw new Error(`invalid page index ${index}`);
            return new MeteoriumEmbedBuilder(interaction.user)
                .setAuthor({
                    name: `Cases | ${user ? `${user.username} (${user.id})` : interaction.guild.name}`,
                    iconURL: user
                        ? user.displayAvatarURL({ extension: "png", size: 256 })
                        : interaction.guild.iconURL({ extension: "png", size: 256 }) || undefined,
                })
                .setFields(
                    pagedCases[index].map((caseData) => ({
                        name: `Case ${caseData.CaseId} - ${caseData.Action}${caseData.Removed ? " - [R]" : ""}`,
                        value: caseData.Reason,
                    })),
                )
                .setFooter({
                    text: `Page ${index + 1}/${pagedCases.length} | Warned: ${warns} | Muted: ${mutes} | Kicked: ${kicks} | Banned: ${bans} | TempBanned: ${tempBans} | Unbanned: ${unbans}`,
                });
        }

        // Function to create action row containing buttons to control the index
        function createActionRow(index: number) {
            return new ActionRowBuilder<ButtonBuilder>().addComponents([
                new ButtonBuilder()
                    .setCustomId(`${index - 1}`)
                    .setLabel("Previous")
                    .setEmoji({ name: "◀️" })
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(index <= 0),
                new ButtonBuilder()
                    .setCustomId(`${index + 1}`)
                    .setLabel("Next")
                    .setEmoji({ name: "▶️" })
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(index < 0 || index == pagedCases.length - 1),
            ]);
        }

        // Function to create message option based on current index
        function createMessageOption(index: number) {
            return {
                embeds: [createPageEmbed(index)],
                components: pagedCases.length > 1 ? [createActionRow(index)] : undefined,
            };
        }

        // Set to starting point
        await interaction.editReply(createMessageOption(0));

        // Collector
        const collector = sentReplyMsg.createMessageComponentCollector({ idle: 150000 });
        collector.on("collect", async (collectInteraction) => {
            if (collectInteraction.user.id != interaction.user.id) {
                await collectInteraction.reply({
                    content: "Only the user who requested this command can control the page index.",
                    ephemeral: true,
                });
                return;
            }

            await interaction.editReply(createMessageOption(Number(collectInteraction.customId)));
            return;
        });
        collector.on("end", async () => {
            if (pagedCases.length == 1) return;
            await interaction.editReply({ components: [createActionRow(-1)] });
            return;
        });

        return;
    },
};
