import { SlashCommandBuilder } from "discord.js";
import type { MeteoriumChatCommand } from "../../index.js";

export const Command: MeteoriumChatCommand = {
    InteractionData: new SlashCommandBuilder()
        .setName("errortest")
        .setDescription("Error handling during command dispatching test")
        .setDMPermission(true),
    async Callback() {
        throw new Error("Intentional error");
    },
};
