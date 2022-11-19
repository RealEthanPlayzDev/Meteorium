import type { MeteoriumEvent } from ".";

export const Event: MeteoriumEvent<"interactionCreate"> = {
    async Callback(client, interaction) {
        if (!interaction.inCachedGuild()) return;
        if (interaction.isChatInputCommand()) {
            const Command = client.Commands.get(interaction.commandName)
            if (Command == undefined) return console.error("Unexpected behavior when handling slash command interaction: " + interaction.commandName + " doesn't exist on client.Commands.");
            try {
                await Command.Callback(interaction, client);
            } catch(err) {
                console.error("Slash command callback error: " + err);
                if (interaction.deferred) {
                    await interaction.editReply({ content: "Slash command callback error: " + err });
                } else {
                    await interaction.reply({ content: "Slash command callback error: " + err, ephemeral: true });
                }
            }
        };
        
        return;
    }
}