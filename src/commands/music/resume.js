const MeteoriumCommand = require("../../util/Command");

module.exports = new MeteoriumCommand("resume", "Resumes the current track", async (interaction, client) => {
    const queue = client.Player.getQueue(interaction.guildId);
    if (!queue) {
        return await interaction.reply({ content: "The bot doesn't seem to be connected to any voice channels." });
    }
    queue.setPaused(false);
    return interaction.reply({content: "Resumed the current track."});
})