const MeteoriumEmbed = require("../../util/MeteoriumEmbed");
const MeteoriumCommand = require("../../util/Command");
const Neko = require("neko-love.js");

module.exports = new MeteoriumCommand("neko", "Random nekomimi/catgirl picture", async (interaction, client) => {
    await interaction.deferReply();
    try {
        const nekopic = await Neko("neko");
        await interaction.editReply({ embeds: [
            new MeteoriumEmbed("Random neko picture").setImage(nekopic)
        ]});
    } catch(err) {
        await interaction.editReply({ embeds: [
            new MeteoriumEmbed("Failed getting a random neko picture", String(err), "FF0000")
        ]})
    }
});