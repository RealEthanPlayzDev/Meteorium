const { SlashCommandBuilder } = require("@discordjs/builders");
const MeteoriumCommand = require("../../util/Command");

module.exports = new MeteoriumCommand("unmute", "Unmutes a person", async (interaction, client) => {
    await interaction.reply("Not yet implemented.");
}, new SlashCommandBuilder()
    .setName("unmute")
    .setDescription("Unmutes a person")
    .addSubcommand(subcommand => subcommand.setName("user")
                                    .setDescription("Unmute someone by their user mention")
                                    .addMentionableOption(option => option.setName("user").setDescription("Target user").setRequired(true)))
    .addSubcommand(subcommand => subcommand.setName("id")
                                    .setDescription("Unmute someone by their user id")
                                    .addStringOption(option => option.setName("userid").setDescription("Target userid").setRequired(true)))
);