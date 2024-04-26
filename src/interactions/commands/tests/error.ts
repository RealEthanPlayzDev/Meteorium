import { SlashCommandBuilder } from "discord.js";
import type { MeteoriumChatCommand } from "../../index.js";

export const Command: MeteoriumChatCommand = {
    interactionData: new SlashCommandBuilder()
        .setName("errortest")
        .setDescription("Error handling during command dispatching test")
        .setDMPermission(true),
    async callback() {
        throw new Error("Intentional error");
    },
};
