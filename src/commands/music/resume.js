const { MessageEmbed } = require("discord.js");
const MeteoriumCommand = require("../../util/Command");

module.exports = new MeteoriumCommand("resume", "Resumes the current track", async (interaction, client) => {
    const queue = client.Player.getQueue(interaction.guildId);
    queue.setPaused(false);
    return interaction.reply({content: "Resumed the current track."});
})