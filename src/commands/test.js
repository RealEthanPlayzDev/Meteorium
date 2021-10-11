const { SlashCommandBuilder } = require("@discordjs/builders");

var command = {
    name: "test",
    description: "Test command",
    interactionData: null,
    async execute(interaction, client) {
        await interaction.reply("The command ran successfully.");
    }
}

command.interactionData = new SlashCommandBuilder()
    .setName(command.name)
    .setDescription(command.description);

module.exports = command;