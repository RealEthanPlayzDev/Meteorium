const { MessageEmbed } = require("discord.js");
const MeteoriumCommand = require("../../util/Command");
const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = new MeteoriumCommand("volume", "Set the volume of the music player", async (interaction, client) => {
    const queue = client.Player.getQueue(interaction.guildId);
    if (!queue) {
        return await interaction.reply({ content: "The bot doesn't seem to be connected to any voice channels." });
    }
    const volpercent = interaction.options.getNumber("volumepercentage");
    if (!queue?.playing) {
        return await interaction.reply({ embeds: [
            new MeteoriumCommand("Nothing is in the music queue!", "The music queue is empty.", "FF0000")
        ]});
    }
    if (!volpercent) {
		return interaction.reply({content: `The current volume is ${queue.volume}%`,})
    }
    if (volpercent < 0 || volpercent > 100) {
		return interaction.reply({content: "The volume must be betweeen 1% and 100%",});
    }
    queue.setVolume(volpercent);
    return interaction.reply({content: `Setted the volume to ${volpercent}%`})
}, new SlashCommandBuilder()
    .setName("volume")
    .setDescription("Set the volume of the music player")
    .addNumberOption(option => option.setName("volumepercentage").setDescription("Volume percentage (1-100), if not specified then will reply with current volume.").setRequired(false)))