import { SlashCommandBuilder } from "discord.js";
import type { MeteoriumCommand } from "..";
import { MeteoriumEmbedBuilder } from "../../util/MeteoriumEmbedBuilder";

export const Command: MeteoriumCommand = {
    InteractionData: new SlashCommandBuilder().setName("embedtest").setDescription("Command to test embeds"),
    async Callback(interaction) {
        return await interaction.reply({
            embeds: [
                new MeteoriumEmbedBuilder(undefined, interaction.user)
                    .setTitle("The command worked")
                    .setDescription("Hello there")
                    .addFields({ name: "Field 1", value: "why not?" }),
                new MeteoriumEmbedBuilder(undefined, interaction.user)
                    .setTitle("Error version")
                    .setDescription("bruh")
                    .setErrorColor(),
            ],
        });
    },
};
