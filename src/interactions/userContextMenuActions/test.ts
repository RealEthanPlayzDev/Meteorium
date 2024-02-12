import { ContextMenuCommandBuilder, ApplicationCommandType } from "discord.js";
import type { MeteoriumUserContextMenuAction } from "../index.js";

export const UserContextMenuAction: MeteoriumUserContextMenuAction = {
    interactionData: new ContextMenuCommandBuilder()
        .setName("test")
        .setType(ApplicationCommandType.User)
        .setDMPermission(true),
    async callback(interaction, _) {
        return interaction.reply(`OK - DM: ${interaction.channel?.isDMBased() ? "Yes" : "No"}`);
    },
};
