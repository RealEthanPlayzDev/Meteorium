const MeteoriumCommand = require("../../util/Command");
const MeteoriumEmbed = require("../../util/MeteoriumEmbed");
const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = new MeteoriumCommand("react", "Reacts to a message with a specified emoji", async (interaction, client) => {
    if (!interaction.member.permissions.has("MANAGE_MESSAGES", true)) {
        return await interaction.reply({ embeds: [
            new MeteoriumEmbed("Cannot react to message", "You do not have permission to use this command. (Missing permission MANAGE_MESSAGES)", "FF0000")
        ]})
    }
    await interaction.deferReply();
    const channel = interaction.options.getChannel("channel") ? interaction.options.getChannel("channel") : interaction.channel, messageid = interaction.options.getString("messageid"), emoji = interaction.options.getString("emoji"), ephmeral = interaction.options.getBoolean("ephmeral") ? interaction.options.getBoolean("ephmeral") : false;
    let targetmessage, targetemoji;

    try {
        targetmessage = await channel.messages.fetch(messageid);
    } catch(e) {}
    if (interaction.guild.emojis.cache.get(emoji)) {
        targetemoji = interaction.guild.emojis.cache.get(emoji);
    } else if (interaction.guild.emojis.cache.find(emoji => emoji.name === emoji)) {
        targetemoji = interaction.guild.emojis.cache.find(emoji => emoji.name === emoji);
    } else {
        targetemoji = undefined;
    }
    if (!channel.isText()) { return await interaction.editReply({ content: "This text channel is not a text/thread channel", ephemeral: ephmeral }) }
    if (!targetmessage) { return await interaction.editReply({ content: `Cannot find message "${messageid}" in channel <#${channel.id}> (${channel.id})`, ephemeral: ephmeral }) }
    if (!targetemoji) { return await interaction.editReply({ content: "Cannot find emoji in cache", ephemeral: ephmeral }) }

    targetmessage.react(targetemoji);
    return await interaction.editReply({ content: "Successfully reacted to message", ephmeral: ephmeral })
}, new SlashCommandBuilder()
    .setName("react")
    .setDescription("Reacts to a message with a specified emoji")
    .addStringOption(option => option.setName("messageid").setDescription("The message where the bot will react to (message id)").setRequired(true))
    .addStringOption(option => option.setName("emoji").setDescription("The emoji to be used on reacting to the message (supports both emoji id and normal emoji name)").setRequired(true))
    .addBooleanOption(option => option.setName("ephemeral").setDescription("If true, any interaction feedbacks will be only shown to you"))
    .addChannelOption(option => option.setName("channel").setDescription("The text/thread channel where the message you want to react to is located"))
);