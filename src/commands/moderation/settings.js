const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const MeteoriumCommand = require("../../util/Command");
const GuildSettingSchema = require("../../schemas/GuildSettingSchema");

module.exports = new MeteoriumCommand("settings", "Command to change settings for this server", async (interaction, client) => {
    await interaction.deferReply();
    if (interaction.options.getSubcommand() === "enforcesayinexecutor") {
         if (interaction.member.permissions.has("ADMINISTRATOR", true)) {
            GuildSettingSchema.findOneAndUpdate({ GuildId: String(interaction.guildId) }, { EnforceSayinExecutor: interaction.options.getBoolean("enabled") }).then(async () => {
                await interaction.editReply(`Successfully changed setting "EnforceSayinExecutor", new value: ${interaction.options.getBoolean("enabled")}`);
             }).catch((err) => {
                throw new Error(`An error occured when updated the settings database\n${err.stack}`);
             });
         } else {
             await interaction.editReply({ embeds: [
                 new MessageEmbed()
                    .setTitle("Cannot change this setting")
                    .setDescription("You do not have permission to change this setting! (Missing permission ADMINISTRATOR)")
                    .setColor("FF0000")
                    .setFooter("Meteorium | Developed by RadiatedExodus (RealEthanPlayzDev)")
                    .setTimestamp()
             ]});
         }
    }
}, new SlashCommandBuilder()
    .setName("settings")
    .setDescription("Command to change settings for this server")
    .addSubcommand(subcommand => subcommand.setName("enforcesayinexecutor")
                                    .setDescription("If true, sayin command will enforce telling the executor's name no matter what.")
                                    .addBooleanOption(option => option.setName("enabled").setDescription("Enabled or not").setRequired(true))));