const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const MeteoriumCommand = require("../../util/Command");

module.exports = new MeteoriumCommand("ban", "Bans a user", async (interaction, client) => {
    if (interaction.member.permissions.has("BAN_MEMBERS", true)) {
        if (interaction.options.getSubcommand() === "user") {
            const targetUser = interaction.options.getMember("user");
            if (targetUser.bannable) {
                targetUser.ban({days: 0, reason: `Administrative ban issued by ${interaction.user.username}`});
                await interaction.reply({ embeds: [
                    new MessageEmbed()
                        .setTitle("User banned")
                        .setDescription("User has been successfully banned")
                        .setColor("0099ff")
                        .setFooter("Meteorium | Developed by RadiatedExodus (RealEthanPlayzDev)")
                        .setTimestamp()
                ]})
            } else {
                await interaction.reply({ embeds: [
                    new MessageEmbed()
                        .setTitle("Cannot ban user")
                        .setDescription("This user cannot be banned! (bannable == false)")
                        .setColor("FF0000")
                        .setFooter("Meteorium | Developed by RadiatedExodus (RealEthanPlayzDev)")
                        .setTimestamp()
                ]})
            }
        } else if(interaction.options.getSubcommand() === "userid") {
            const userId = interaction.options.getString("userid");
            if (interaction.guild.members.fetch(userId)) {
                const targetUser = await interaction.guild.members.fetch(userId);
                if (targetUser.bannable) {
                    targetUser.ban({days: 0, reason: `Administrative ban requested by ${interaction.user.username}`});
                    await interaction.reply({ embeds: [
                        new MessageEmbed()
                            .setTitle("User banned")
                            .setDescription("User has been successfully banned")
                            .setColor("0099ff")
                            .setFooter("Meteorium | Developed by RadiatedExodus (RealEthanPlayzDev)")
                            .setTimestamp()
                    ]})
                } else {
                    await interaction.reply({ embeds: [
                        new MessageEmbed()
                            .setTitle("Cannot ban user")
                            .setDescription("This user cannot be banned! (bannable == false) ")
                            .setColor("FF0000")
                            .setFooter("Meteorium | Developed by RadiatedExodus (RealEthanPlayzDev)")
                            .setTimestamp()
                    ]})
                }
            }
        }
    } else {
        await interaction.reply({ embeds: [
            new MessageEmbed()
                .setTitle("Cannot ban user")
                .setDescription("You do not have permission to kick this user! (Missing permission BAN_MEMBERS)")
                .setColor("FF0000")
                .setFooter("Meteorium | Developed by RadiatedExodus (RealEthanPlayzDev)")
                .setTimestamp()
        ]})
    }
}, new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Bans a user")
    .addSubcommand(subcommand => subcommand
                                    .setName("user")
                                    .setDescription("Ban by selecting a user")
                                    .addUserOption(option => option.setName("user").setDescription("Target user").setRequired(true)))
    .addSubcommand(subcommand => subcommand
                                    .setName("userid")
                                    .setDescription("Ban using the userid")
                                    .addStringOption(option => option.setName("userid").setDescription("Target UserId").setRequired(true))));