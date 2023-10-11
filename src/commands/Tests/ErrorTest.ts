import { SlashCommandBuilder } from "discord.js";
import type { MeteoriumCommand } from "..";

export const Command: MeteoriumCommand = {
    InteractionData: new SlashCommandBuilder().setName("errortest").setDescription("Command to test error handling"),
    async Callback() {
        throw new Error("This is a error test command, it throws a error obviously.");
    },
};
