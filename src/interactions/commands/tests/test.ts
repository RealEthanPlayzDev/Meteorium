import { SlashCommandBuilder } from "discord.js";
import type { MeteoriumChatCommand } from "../../index.js";

export const Command: MeteoriumChatCommand = {
    interactionData: new SlashCommandBuilder()
        .setName("test")
        .setDescription("Test command for checking command handling and dispatching")
        .setDMPermission(true),
    async callback(interaction, _) {
        return interaction.reply(`OK - DM: ${interaction.channel?.isDMBased() ? "Yes" : "No"}`);
    },
};
