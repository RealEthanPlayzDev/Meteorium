const MeteoriumEmbed = require("../../util/MeteoriumEmbed");
const MeteoriumCommand = require("../../util/Command");

module.exports = new MeteoriumCommand("embedtest", "Embed test command.", async (interaction, client) => {
    await interaction.reply({ embeds: [
        new MeteoriumEmbed("Test command - embeds", "This is the embed description")
            .setURL("https://github.com/RealEthanPlayzDev/Meteorium")
            .addFields(
                {
                    name: "Field #1 name",
                    value: "An value, obviously."
                },
                {
                    name: "Field #2 name",
                    value: "different value."
                },
                {
                    name: "Inline field #1 name",
                    value: "sus",
                    inline: true
                },
                {
                    name: "Inline field #2 name",
                    value: "The second inline field value",
                    inline: true
                },
            ),
        new MeteoriumEmbed()
    ]});
});