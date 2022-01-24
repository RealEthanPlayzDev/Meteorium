const MeteoriumCommand = require("../../util/Command");

module.exports = new MeteoriumCommand("pause", "Pause the current track", async (interaction, client) => {
    const queue = client.Player.getQueue(interaction.guildId);
    if (!queue) {
        return await interaction.reply({ content: "The bot doesn't seem to be connected to any voice channels." });
    }
    queue.setPaused(true);
    return interaction.reply({content: "Paused the current track."});
})