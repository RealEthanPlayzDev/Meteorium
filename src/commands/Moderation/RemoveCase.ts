import { SlashCommandBuilder } from "discord.js";
import type { MeteoriumCommand } from "..";

export const Command: MeteoriumCommand = {
    InteractionData: new SlashCommandBuilder()
        .setName("removecase")
        .setDescription("Removes a user punishment/case")
        .addUserOption((option) => option.setName("user").setDescription("The user").setRequired(true)),
    async Callback(interaction) {
        if (!interaction.member.permissions.has("ViewAuditLog"))
            return await interaction.editReply({
                content: "You do not have permission to remove user punishments.",
            });
        return await interaction.reply({ content: "TODO: Implement" });
    },
};
