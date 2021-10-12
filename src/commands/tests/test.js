const MeteoriumCommand = require("../../util/Command");

module.exports = new MeteoriumCommand("test", "Test command.", async (interaction, client) => {
    await interaction.reply("The command ran successfully.");
});