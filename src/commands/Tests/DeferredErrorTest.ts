import { SlashCommandBuilder } from "discord.js";
import type { MeteoriumCommand } from "..";

export const Command: MeteoriumCommand = {
    InteractionData: new SlashCommandBuilder()
        .setName("deferrederrortest")
        .setDescription("Command to test error handling (deferred reply version)"),
    async Callback(interaction) {
        await interaction.deferReply();
        throw new Error("This is a error test command, it throws a error obviously.");
    },
};
