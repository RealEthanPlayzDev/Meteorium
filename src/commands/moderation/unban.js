const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const MeteoriumCommand = require("../../util/Command");

module.exports = new MeteoriumCommand("unban", "Unbans a user using their UserId", async (interaction, client) => {
    if (interaction.member.permissions.has("BAN_MEMBERS", true)) {
        const userId = interaction.options.getString("userid");
        const banList = await interaction.guild.bans.fetch();
        if (banList.has(userId)) {
            interaction.guild.members.unban(userId, `Administrative unban issued by ${interaction.user.username}`);
            await interaction.reply({ embeds: [
                new MessageEmbed()
                    .setTitle("User unbanned")
                    .setDescription("User has been successfully unbanned")
                    .setColor("0099ff")
                    .setFooter("Meteorium | Developed by RadiatedExodus (RealEthanPlayzDev)")
                    .setTimestamp()
            ]});
        } else {
            await interaction.reply({ embeds: [
                new MessageEmbed()
                    .setTitle("Cannot unban user")
                    .setDescription("This user isn't banned!")
                    .setColor("0099ff")
                    .setFooter("Meteorium | Developed by RadiatedExodus (RealEthanPlayzDev)")
                    .setTimestamp()
            ]});
        }
    } else {
        await interaction.reply({ embeds: [
            new MessageEmbed()
                .setTitle("Cannot unban user")
                .setDescription("You do not have permission to run this command! (Missing permission BAN_MEMBERS)")
                .setColor("FF0000")
                .setFooter("Meteorium | Developed by RadiatedExodus (RealEthanPlayzDev)")
                .setTimestamp()
        ]})
    }
}, new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Unbans a user using their UserId")
    .addStringOption(option => option.setName("userid").setDescription("Target userid of the user to unban").setRequired(true)));