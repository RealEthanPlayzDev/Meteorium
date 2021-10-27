const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const MeteoriumCommand = require("../../util/Command");
const GuildSettingSchema = require("../../schemas/GuildSettingSchema");

module.exports = new MeteoriumCommand("sayin", "Says message in a optional channel (or current channel) in this server", async (interaction, client) => {
    if (interaction.member.permissions.has("MANAGE_MESSAGES", true)) {
        const guildSchema = await GuildSettingSchema.findOne({ GuildId: String(interaction.guildId) }).exec();
        const showExecutorName = (guildSchema.EnforceSayinExecutor && !interaction.member.permissions.has("ADMINISTRATOR", true) && true || (interaction.options.getBoolean("showexecutorname") === null && true || false))
        const doNotShowSuccessMessage = !(interaction.options.getBoolean("showsuccessmessage") === null && true || interaction.options.getBoolean("showsuccessmessage"));
        const msg = (showExecutorName && interaction.options.getString("message")+`\n\n(Sayin command executed by ${interaction.member})` || interaction.options.getString("message")), channel = interaction.options.getChannel("channel") ? interaction.options.getChannel("channel") : interaction.channel;
        if (doNotShowSuccessMessage) {
            if (!interaction.member.permissions.has("ADMINISTRATOR", true)) {
                await interaction.reply({ embeds: [
                    new MessageEmbed()
                        .setTitle("Cannot do sayin")
                        .setDescription("You do not have permission to not show the success message (Missing ADMINISTRATOR permission).")
                        .setColor("FF0000")
                        .setFooter("Meteorium | Developed by RadiatedExodus (RealEthanPlayzDev)")
                        .setTimestamp()
                ]})
                return;
            }
        }
        if (!channel.isText()) {
            await interaction.reply({ embeds: [
                new MessageEmbed()
                    .setTitle("Cannot do sayin")
                    .setDescription("Specified channel is not a text channel.")
                    .setColor("FF0000")
                    .setFooter("Meteorium | Developed by RadiatedExodus (RealEthanPlayzDev)")
                    .setTimestamp()
            ], ephemeral: doNotShowSuccessMessage })
            return;
        }
        await channel.send(msg);
        await interaction.reply({ content: "Successfully sent message.", ephemeral: doNotShowSuccessMessage });
    } else {
        await interaction.reply({embeds: [
            new MessageEmbed()
                .setTitle("Cannot do sayin")
                .setDescription("You do not have permission to use this command! (Missing permission MANAGE_MESSAGES)")
                .setColor("FF0000")
                .setFooter("Meteorium | Developed by RadiatedExodus (RealEthanPlayzDev)")
                .setTimestamp()
        ]})
    }
}, new SlashCommandBuilder()
    .setName("sayin")
    .setDescription("Says message in a channel in this server")
    .addStringOption(option => option.setName("message").setDescription("The message to be sent").setRequired(true))
    .addChannelOption(option => option.setName("channel").setDescription("Optional channel where message will be sent (if not specified it will be sent to the current channel"))
    .addBooleanOption(option => option.setName("showexecutorname").setDescription("Show the executor name or not (can be overriden by EnforceSayinExecutor, doesn't include admins)"))
    .addBooleanOption(option => option.setName("showsuccessmessage").setDescription("Shows the success message or not (if false then success message only shows to you)").setRequired(false))
);