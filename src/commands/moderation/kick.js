const { SlashCommandBuilder } = require("@discordjs/builders");
const MeteoriumCommand = require("../../util/Command");
const MeteoriumEmbed = require("../../util/MeteoriumEmbed");

module.exports = new MeteoriumCommand("kick", "Kicks a user", async (interaction, client) => {
    if (interaction.member.permissions.has("KICK_MEMBERS", true)) {
        if (interaction.options.getSubcommand() === "user") {
            const targetUser = interaction.options.getMember("user");
            if (targetUser.kickable) {
                targetUser.kick(`Administrative kick issued by ${interaction.user.username}`);
                await interaction.reply({ embeds: [
                    new MeteoriumEmbed("User kicked", "User has been successfully kicked")
                ]})
            } else {
                await interaction.reply({ embeds: [
                    new MeteoriumEmbed("Cannot kick user", "This user cannot be kicked! (kickable == false)", "FF0000")
                ]})
            }
        } else if(interaction.options.getSubcommand() === "userid") {
            const userId = interaction.options.getString("userid");
            if (interaction.guild.members.fetch(userId)) {
                const targetUser = await interaction.guild.members.fetch(userId);
                if (targetUser.kickable) {
                    targetUser.kick(`Administrative kick requested by ${interaction.user.username}`);
                    await interaction.reply({ embeds: [
                        new MeteoriumEmbed("User kicked", "User has been successfully kicked", "0099ff")
                    ]})
                } else {
                    await interaction.reply({ embeds: [
                        new MeteoriumEmbed("Cannot kick user", "This user cannot be kicked! (kickable == false)", "FF0000")
                    ]})
                }
            }
        }
    } else {
        await interaction.reply({ embeds: [
            new MeteoriumEmbed("Cannot kick user", "You do not have permission to kick this user! (Missing permission KICK_MEMBERS)", "FF0000")
        ]})
    }
}, new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kicks a user")
    .addSubcommand(subcommand => subcommand
                                    .setName("user")
                                    .setDescription("Kick by selecting a user")
                                    .addUserOption(option => option.setName("user").setDescription("Target user").setRequired(true)))
    .addSubcommand(subcommand => subcommand
                                    .setName("userid")
                                    .setDescription("Kick using the userid")
                                    .addStringOption(option => option.setName("userid").setDescription("Target UserId").setRequired(true))));