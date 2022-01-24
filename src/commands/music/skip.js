const { SlashCommandBuilder } = require("@discordjs/builders");
const MeteoriumCommand = require("../../util/Command");

module.exports = new MeteoriumCommand("skip", "Skips the current track", async (interaction, client) => {
    const queue = client.Player.getQueue(interaction.guildId), amountoftracks = interaction.options.getNumber("amountoftracks");
    if (!queue) {
        return await interaction.reply({ content: "The bot doesn't seem to be connected to any voice channels." });
    }
    if (!amountoftracks) {
        await queue.skip();
        return interaction.reply({content: "Skipped the current track."});
    } else {
        await queue.skipTo(amountoftracks);
        return interaction.reply({content: `Skipped ${amountoftracks} tracks.`});
    }
}, new SlashCommandBuilder()
    .setName("skip")
    .setDescription("Skips the current track")
    .addNumberOption(option => option.setName("amountoftracks").setDescription("The amount of tracks to skip").setRequired(false)))