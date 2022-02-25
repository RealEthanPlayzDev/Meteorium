const { SlashCommandBuilder } = require("@discordjs/builders");
const MeteoriumEmbed = require("../../util/MeteoriumEmbed");
const MeteoriumCommand = require("../../util/Command");

module.exports = new MeteoriumCommand("unban", "Unbans a user using their UserId", async (interaction, client) => {
    if (interaction.member.permissions.has("BAN_MEMBERS", true)) {
        const userId = interaction.options.getString("userid");
        const banList = await interaction.guild.bans.fetch();
        if (banList.has(userId)) {
            interaction.guild.members.unban(userId, `Administrative unban issued by ${interaction.user.username}`);
            await interaction.reply({ embeds: [
                new MeteoriumEmbed("User unbanned", "User has been successfully unbanned")
            ]});
        } else {
            await interaction.reply({ embeds: [
                new MeteoriumEmbed("Cannot unban user", "This user isn't banned!", "FF0000")
            ]});
        }
    } else {
        await interaction.reply({ embeds: [
            new MeteoriumEmbed("Cannot unban user", "You do not have permission to run this command! (Missing permission BAN_MEMBERS)", "FF0000")
        ]});
    }
}, new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Unbans a user using their UserId")
    .addStringOption(option => option.setName("userid").setDescription("Target userid of the user to unban").setRequired(true)));