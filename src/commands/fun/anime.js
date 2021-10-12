const { MessageEmbed } = require("discord.js");
const MeteoriumCommand = require("../../util/Command");
const srod = require("something-random-on-discord");
const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = new MeteoriumCommand("anime", "Random anime pictures", async (interaction, client) => {
    await interaction.deferReply();
    const action = interaction.options.getString("action")
    try {
        const pic = await srod.Random.getAnimeImgURL(action);
        await interaction.editReply({ embeds: [
            new MessageEmbed()
                .setTitle(`Random anime ${action} picture`)
                .setImage(pic)
                .setColor("0099ff")
        ]});
    } catch(err) {
        await interaction.editReply({ embeds: [
            new MessageEmbed()
                .setTitle(`Failed getting a random anime ${action} picture`)
                .setDescription(String(err))
                .setColor("FF0000")
                .setFooter("Meteorium | Developed by RadiatedExodus (RealEthanPlayzDev)")
                .setTimestamp()
        ]})
    }
}, new SlashCommandBuilder()
    .setName("anime")
    .setDescription("Random anime action pictures")
    .addStringOption(option => option.setName("action") // "pat", "hug", "waifu", "cry", "kiss", "slap", "smug", "punch0"
                                .setDescription("Action")
                                .setRequired(true)
                                .addChoice("pat", "pat")
                                .addChoice("hug", "hug")
                                .addChoice("waifu", "waifu")
                                .addChoice("cry", "cry")
                                .addChoice("kiss", "kiss")
                                .addChoice("slap", "slap")
                                .addChoice("smug", "smug")
                                .addChoice("punch", "punch")));