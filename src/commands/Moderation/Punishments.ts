import { ModerationAction } from "@prisma/client";
import { SlashCommandBuilder } from "discord.js";
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

        const Embed = new MeteoriumEmbedBuilder()
            .setAuthor({
                name: `${User.username}`,
                iconURL: User.displayAvatarURL({ extension: "png" }),
            })
            .setTimestamp()
            .setNormalColor();

        const Punishments = await client.Database.moderationCase.findMany({
            where: { TargetUserId: User.id },
            orderBy: { CaseId: "desc" },
        });
        let TotalKick = 0,
            TotalWarn = 0,
            TotalBan = 0,
            TotalMute = 0;
        if (Punishments.length == 0) {
            Embed.setDescription("This user has no moderation punishments/cases recorded.");
        } else {
            let Count = 0;
            for (const Case of Punishments) {
                Count++;
                if (Count <= 25) {
                    Embed.addFields([
                        {
                            name: `Case ${Case.CaseId} - ${Case.Action}`,
                            value: Case.Reason,
                        },
                    ]);
                }
                switch (Case.Action) {
                    case ModerationAction.Warn: {
                        TotalWarn++;
                        break;
                    }
                    case ModerationAction.Mute: {
                        TotalMute++;
                        break;
                    }
                    case ModerationAction.Kick: {
                        TotalKick++;
                        break;
                    }
                    case ModerationAction.Ban: {
                        TotalBan++;
                        break;
                    }
                    default:
                        break;
                }
            }
            Embed.setFooter({
                text: `Warned: ${TotalWarn} | Muted: ${TotalMute} | Kicked: ${TotalKick} | Banned: ${TotalBan}`,
            });
        }

        return await interaction.reply({ embeds: [Embed] });
    },
};
