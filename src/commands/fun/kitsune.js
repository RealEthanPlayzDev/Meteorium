const { MessageEmbed } = require("discord.js");
const MeteoriumCommand = require("../../util/Command");
const Neko = require("neko-love.js");

module.exports = new MeteoriumCommand("kitsune", "Random kitsune pictures", async (interaction, client) => {
    interaction.deferReply();
    try {
        const kitsunepic = await Neko("kitsune");
        await interaction.editReply({ embeds: [
            new MessageEmbed()
                .setTitle("Random kitsune picture")
                .setImage(kitsunepic)
                .setColor("FF0000")
        ]});
    } catch(err) {
        await interaction.editReply({ embeds: [
            new MessageEmbed()
                .setTitle("Failed getting a random kitsunr picture")
                .setDescription(String(err))
                .setColor("FF0000")
                .setFooter("Meteorium | Developed by RadiatedExodus (RealEthanPlayzDev)")
                .setTimestamp()
        ]});
    }
});