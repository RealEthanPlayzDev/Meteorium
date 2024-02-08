import { ContextMenuCommandBuilder, ApplicationCommandType } from "discord.js";
import type { MeteoriumMessageContextMenuAction } from "..";

export const ContextMenuAction: MeteoriumMessageContextMenuAction = {
    Name: "SayIn reply",
    Type: ApplicationCommandType.Message,
    InteractionData: new ContextMenuCommandBuilder().setName("SayIn reply").setType(ApplicationCommandType.User),
    async Callback(interaction) {
        return await interaction.reply({ content: "TODO" });
    },
};
