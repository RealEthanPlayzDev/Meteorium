const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const MeteoriumCommand = require("../../util/Command");

module.exports = new MeteoriumCommand("sayin", "Says message in a optional channel (or current channel) in this server", async (interaction, client) => {
    if (interaction.member.permissions.has("MANAGE_MESSAGES"), true) {
        const msg = interaction.options.getString("message"), channel = interaction.options.getChannel("channel") ? interaction.options.getChannel("channel") : interaction.channel;
        if (!channel.isText()) {
            await interaction.options.reply({ embeds: [
                new MessageEmbed()
                    .setTitle("Cannot do sayin")
                    .setDescription("Specified channel is not a text channel.")
                    .setColor("FF0000")
                    .setFooter("Meteorium | Developed by RadiatedExodus (RealEthanPlayzDev)")
                    .setTimestamp()
            ]})
            return;
        }
        await channel.send(msg);
        await interaction.reply("Successfully sent message.");
    } else {
        await interaction.reply({embeds: [
            new MessageEmbed()
                .setTitle("Cannot do sayin")
                .setDescription("You do not have permission to use this command! (Missing permission MANAGE_MESSAGES)")
                .setColor("FF0000")
                .setFooter("Meteorium | Developed by RadiatedExodus (RealEthanPlayzDev)")
                .setTimestamp()
        ]})
    }
}, new SlashCommandBuilder()
    .setName("sayin")
    .setDescription("Says message in a channel in this server")
    .addStringOption(option => option.setName("message").setDescription("The message to be sent").setRequired(true))
    .addChannelOption(option => option.setName("channel").setDescription("Optional channel where message will be sent (if not specified it will be sent to the current channel")));