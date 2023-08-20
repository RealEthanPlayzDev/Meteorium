import { SlashCommandBuilder } from 'discord.js';
import type { MeteoriumCommand } from "..";

export const Command: MeteoriumCommand = {
    InteractionData: new SlashCommandBuilder()
        .setName("test")
        .setDescription("This is a test command"),
    async Callback(interaction) {
        return await interaction.reply({ content: "The test command worked." });
    }
}