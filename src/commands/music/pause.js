const { MessageEmbed } = require("discord.js");
const MeteoriumCommand = require("../../util/Command");

module.exports = new MeteoriumCommand("pause", "Pause the current track", async (interaction, client) => {
    const queue = client.Player.getQueue(interaction.guildId);
    queue.setPaused(true);
    return interaction.reply({content: "Paused the current track."});
})