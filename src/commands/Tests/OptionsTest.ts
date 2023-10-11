import { SlashCommandBuilder } from "discord.js";
import type { MeteoriumCommand } from "..";

export const Command: MeteoriumCommand = {
    InteractionData: new SlashCommandBuilder()
        .setName("optionstest")
        .setDescription("Command to test handling option(s) data")
        .addUserOption((option) => option.setName("user").setRequired(true).setDescription("This is a user option")),
    async Callback(interaction) {
        const User = interaction.options.getUser("user", true);
        await interaction.reply(User.tag);
        await interaction.followUp("This is a follow up message");
        return;
    },
};
