const { MessageActionRow, MessageButton, MessageEmbed } = require("discord.js");
const MeteoriumCommand = require("../../util/Command");

module.exports = new MeteoriumCommand("help", "Shows information about the bot", async (interaction, client) => {
    await interaction.reply({ embeds: [
        new MessageEmbed()
            .setAuthor("Meteorium", null, "https://github.com/RealEthanPlayzDev/Meteorium")
            .setDescription("A Discord bot developed by RadiatedExodus (ItzEthanPlayz_YT/RealEthanPlayzDev) as a side (and personal) project, written in Javascript using Node.js and Discord.js, also being used as a way for me to learn Javascript.")
            .setFooter("Meteorium | Developed by RadiatedExodus (RealEthanPlayzDev)")
            .setColor("0099ff")
            .setTimestamp()
        ], components: [
        new MessageActionRow().addComponents(
            new MessageButton()
                .setStyle("LINK")
                .setURL("https://github.com/RealEthanPlayzDev/Meteorium")
                .setLabel("Open GitHub repository")
        )
    ]});
});