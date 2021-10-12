const { SlashCommandBuilder } = require("@discordjs/builders");
const MeteoriumCommand = require("../../util/Command");

module.exports = new MeteoriumCommand(
    "optionstest",
    "Command interaction with options",
    async (interaction, client) => {
        await interaction.reply(`Reply interaction ${interaction.options.getUser("user")}`)
        await interaction.followUp("Follow up message")
    },
    new SlashCommandBuilder()
        .setName("optionstest")
        .setDescription("Command interaction with options")
        .addUserOption(option => option.setName("user").setDescription("Target user").setRequired(true))
);