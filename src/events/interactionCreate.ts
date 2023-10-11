import type { MeteoriumEvent } from ".";
import { MeteoriumEmbedBuilder } from "../util/MeteoriumEmbedBuilder";

export const Event: MeteoriumEvent<"interactionCreate"> = {
    async Callback(client, interaction) {
        if (!interaction.inCachedGuild()) return;
        if (interaction.isChatInputCommand()) {
            const Command = client.Commands.get(interaction.commandName);
            if (Command == undefined)
                return console.error(
                    "Unexpected behavior when handling slash command interaction: " +
                        interaction.commandName +
                        " doesn't exist on client.Commands.",
                );
            try {
                await Command.Callback(interaction, client);
            } catch (err) {
                console.error("Slash command callback error:\n" + err);
                const ErrorEmbed = new MeteoriumEmbedBuilder(undefined, interaction.user)
                    .setTitle("Error occurred while the command callback was running")
                    .setDescription(String(err))
                    .SetErrorColor();
                if (interaction.deferred) {
                    await interaction.editReply({
                        content: "Error occurred (if you don't see anything below, you have embeds disabled)",
                        embeds: [ErrorEmbed],
                    });
                } else {
                    await interaction.reply({
                        content: "Error occurred (if you don't see anything below, you have embeds disabled)",
                        embeds: [ErrorEmbed],
                        ephemeral: true,
                    });
                }
            }
        }

        return;
    },
};
