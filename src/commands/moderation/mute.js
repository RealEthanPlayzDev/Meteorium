const { SlashCommandBuilder } = require("@discordjs/builders");
const MeteoriumCommand = require("../../util/Command");
const GuildSettingSchema = require("../../schemas/GuildSettingSchema");
const MeteoriumEmbed = require("../../util/MeteoriumEmbed");

module.exports = new MeteoriumCommand("mute", "Mutes a person", async (interaction, client) => {
    await interaction.deferReply();

    if (!interaction.member.permissions.has("MANAGE_MESSAGES", true)) {
        return await interaction.editReply({ embeds: [ new MeteoriumEmbed("Cannot mute user", "You do not have the permission to run this command!", "FF0000") ] });
    }

    const guildSchema = await GuildSettingSchema.findOne({ GuildId: interaction.guildId });
    if (guildSchema.MuteRoleId === "") {
        return await interaction.editReply({ embeds: [ new MeteoriumEmbed("Cannot mute user", "The mute role is not set! You need to set the mute role before using this command.", "FF0000") ] });
    }

    const subcommand = interaction.options.getSubcommand();
    const muterole = interaction.guild.roles.resolve(guildSchema.MuteRoleId);

    switch(subcommand) {
        case "user" : {
            const user = interaction.options.getMember("user");
            user.roles.add(muterole, `Muted by ${interaction.member.displayName} (${interaction.member.id})`);
            return await interaction.editReply(`Successfully muted ${user.displayName} (${user.id}).`);
        }
        case "id" : {
            const user = interaction.guild.members.resolve(interaction.options.getString("id"));
            if (!user) {
                return await interaction.editReply("Cannot find user.");
            }
            user.roles.add(muterole, `Muted by${interaction.member.displayName} (${interaction.member.id})`);
            return await interaction.editReply(`Successfully muted ${user.displayName} (${user.id}).`);
        }
    }
}, new SlashCommandBuilder()
    .setName("mute")
    .setDescription("Mutes a person")
    .addSubcommand(subcommand => subcommand.setName("user")
                                    .setDescription("Mute someone by their user mention")
                                    .addUserOption(option => option.setName("user").setDescription("Target user").setRequired(true)))
    .addSubcommand(subcommand => subcommand.setName("id")
                                    .setDescription("Mute someone by their user id")
                                    .addStringOption(option => option.setName("userid").setDescription("Target userid").setRequired(true)))
);