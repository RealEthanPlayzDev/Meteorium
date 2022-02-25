const MeteoriumEmbed = require("../../util/MeteoriumEmbed");
const MeteoriumCommand = require("../../util/Command");
const Neko = require("neko-love.js");

module.exports = new MeteoriumCommand("kitsune", "Random kitsune pictures", async (interaction, client) => {
    interaction.deferReply();
    try {
        const kitsunepic = await Neko("kitsune");
        await interaction.editReply({ embeds: [
            new MeteoriumEmbed("Random kitsune picture").setImage(kitsunepic)
        ]});
    } catch(err) {
        await interaction.editReply({ embeds: [
            new MessageEmbed("Failed getting a random kitsune picture", String(err), "FF0000")
        ]});
    }
});