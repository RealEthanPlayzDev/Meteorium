const { MessageEmbed } = require("discord.js");
const MeteoriumCommand = require("../../util/Command");

module.exports = new MeteoriumCommand("skip", "Skips the current track", async (interaction, client) => {
    const queue = client.Player.getQueue(interaction.guildId);
    await queue.skip();
    return interaction.reply({content: "Skipped the current track."});
})