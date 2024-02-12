import { SlashCommandBuilder } from "discord.js";
import type { MeteoriumChatCommand } from "../../index.js";

export const Command: MeteoriumChatCommand = {
    InteractionData: new SlashCommandBuilder()
        .setName("deferrortest")
        .setDescription("Error handling during a command dispatching test with deferred reply")
        .setDMPermission(true),
    async Callback(interaction, _) {
        await interaction.deferReply();
        throw new Error("Intentional error");
    },
};
