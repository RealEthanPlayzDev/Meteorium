const { MessageEmbed } = require("discord.js");
const MeteoriumCommand = require("../../util/Command");
const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = new MeteoriumCommand("volume", "Set the volume of the music player", async (interaction, client) => {
    const queue = client.Player.getQueue(interaction.guildId);
    const volpercent = interaction.options.getNumber("volumepercentage");
    if (!queue?.playing) {
        return await interaction.reply({ embeds: [
            new MessageEmbed()
                .setTitle("Nothing is in the music queue!")
                .setDescription(`The music queue is empty.`)
                .setColor("0099ff")
                .setFooter("Meteorium | Developed by RadiatedExodus (RealEthanPlayzDev)")
                .setTimestamp()
        ]})
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