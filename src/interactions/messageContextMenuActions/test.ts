import { ContextMenuCommandBuilder, ApplicationCommandType } from "discord.js";
import type { MeteoriumMessageContextMenuAction } from "../index.js";

export const MessageContextMenuAction: MeteoriumMessageContextMenuAction = {
    interactionData: new ContextMenuCommandBuilder()
        .setName("test")
        .setType(ApplicationCommandType.Message)
        .setDMPermission(true),
    async callback(interaction, _) {
        return interaction.reply(`OK - DM: ${interaction.channel?.isDMBased() ? "Yes" : "No"}`);
    },
};
