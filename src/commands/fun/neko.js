const { MessageEmbed } = require("discord.js");
const MeteoriumCommand = require("../../util/Command");
const Neko = require("neko-love.js");

module.exports = new MeteoriumCommand("neko", "Random nekomimi/catgirl picture", async (interaction, client) => {
    await interaction.deferReply();
    try {
        const nekoembed = await Neko("neko");
        await interaction.editReply({ embeds: [
            new MessageEmbed()
                .setTitle("Random neko picture")
                .setImage(nekoembed.embed.image.ur)
                .setColor("0099ff")
        ]});
    } catch(err) {
        await interaction.editReply({ embeds: [
            new MessageEmbed()
                .setTitle("Failed getting a random neko picture")
                .setDescription(String(err))
                .setColor("FF0000")
                .setFooter("Meteorium | Developed by RadiatedExodus (RealEthanPlayzDev)")
                .setTimestamp()
        ]})
    }
});