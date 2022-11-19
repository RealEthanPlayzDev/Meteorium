import { ActionRowBuilder, ButtonBuilder, SlashCommandBuilder, ButtonStyle } from 'discord.js';
import type { MeteoriumCommand } from "..";
import { MeteoriumEmbedBuilder } from '../../util/MeteoriumEmbedBuilder';

export const Command: MeteoriumCommand = {
    InteractionData: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Shows information about the bot"),
    async Callback(interaction) {
        return await interaction.reply({
            embeds: [
                new MeteoriumEmbedBuilder(undefined, interaction.user)
                    .setTitle("About Meteorium")
                    .setDescription("A Discord bot developed by RadiatedExodus (RealEthanPlayzDev) as a side (and personal) project, written in TypeScript using Node.js and Discord.js, also being used as a way for me to learn TypeScript/JavaScript.")
            ],
            components: [
                new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(
                        new ButtonBuilder()
                            .setStyle(ButtonStyle.Link)
                            .setURL("https://github.com/RealEthanPlayzDev/Meteorium")
                            .setLabel("Open GitHub repository")
                    )
            ]
        });
    }
}