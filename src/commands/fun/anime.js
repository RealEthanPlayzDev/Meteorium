const MeteoriumEmbed = require("../../util/MeteoriumEmbed");
const MeteoriumCommand = require("../../util/Command");
const { SlashCommandBuilder } = require("@discordjs/builders");
const Neko = require("neko-love.js");

module.exports = new MeteoriumCommand("anime", "Random anime pictures", async (interaction, client) => {
    await interaction.deferReply();
    const action = interaction.options.getString("action")
    try {
        const pic = await Neko(action);
        await interaction.editReply({ embeds: [
            new MeteoriumEmbed(`Random anime ${action} picture`, "", "0099ff").setImage(pic)
        ]});
    } catch(err) {
        await interaction.editReply({ embeds: [
            new MeteoriumEmbed(`Failed getting a random anime ${action} picture`, String(err), "FF0000")
        ]});
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
                                .addChoice("punch", "punch"))
);