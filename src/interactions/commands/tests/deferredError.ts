import { SlashCommandBuilder } from "discord.js";
import type { MeteoriumChatCommand } from "../../index.js";

export const Command: MeteoriumChatCommand = {
    interactionData: new SlashCommandBuilder()
        .setName("deferrortest")
        .setDescription("Error handling during a command dispatching test with deferred reply")
        .setDMPermission(true),
    async callback(interaction, _) {
        await interaction.deferReply();
        throw new Error("Intentional error");
    },
};
