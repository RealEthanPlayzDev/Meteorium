const MeteoriumCommand = require("../../util/Command");

module.exports = new MeteoriumCommand("stop", "Stop and disconnect the bot", async (interaction, client) => {
    const queue = client.Player.getQueue(interaction.guildId);
    if (queue) {
        queue.destroy(true);
        return await interaction.reply({ content: "Stopped and disconnected the bot." });
    } else {
        return await interaction.reply({ content: "The bot doesn't seem to be connected to any voice channels." })
    }
})