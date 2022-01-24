const MeteoriumCommand = require("../../util/Command");

module.exports = new MeteoriumCommand("clearqueue", "Clears the queue", async (interaction, client) => {
    const queue = client.Player.getQueue(interaction.guildId);
    if (!queue) {
        return await interaction.reply({ content: "The bot doesn't seem to be connected to any voice channels." });
    }
    queue.clear();
    return await interaction.reply({ content: "Cleared the music queue." })
})