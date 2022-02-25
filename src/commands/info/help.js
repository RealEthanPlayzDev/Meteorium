const { MessageActionRow, MessageButton } = require("discord.js");
const MeteoriumEmbed = require("../../util/MeteoriumEmbed");
const MeteoriumCommand = require("../../util/Command");

module.exports = new MeteoriumCommand("help", "Shows information about the bot", async (interaction, client) => {
    await interaction.reply({ embeds: [
        new MeteoriumEmbed("", "A Discord bot developed by RadiatedExodus (ItzEthanPlayz_YT/RealEthanPlayzDev) as a side (and personal) project, written in Javascript using Node.js and Discord.js, also being used as a way for me to learn Javascript.").setAuthor("Meteorium", null, "https://github.com/RealEthanPlayzDev/Meteorium")
        ], components: [
        new MessageActionRow().addComponents(
            new MessageButton()
                .setStyle("LINK")
                .setURL("https://github.com/RealEthanPlayzDev/Meteorium")
                .setLabel("Open GitHub repository")
        )
    ]});
});