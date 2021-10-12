const { SlashCommandBuilder } = require("@discordjs/builders");
const MeteoriumCommand = require("../../../util/Command");
const { HolodexApiClient } = require("holodex.js");
const { holodexApiKey } = require("../../../../config.json");
const { MessageEmbed } = require("discord.js");
const holodexClient = new HolodexApiClient({
    apiKey: holodexApiKey || ""
});

module.exports = new MeteoriumCommand("getholodexchannelinfo", "Get a channel info from holodex", async (interaction, client) => {
    await interaction.deferReply()
    const channel = (await holodexClient.getChannel(interaction.options.getString("channelid"))).toRaw();
    await interaction.editReply({ embeds: [
        new MessageEmbed()
            .setAuthor(channel.name, null, `https://www.youtube.com/channel/${channel.channelId}`)
            .setThumbnail(channel.photo)
            .setDescription(channel.description)
            .addFields(
                { name: "English name", value: channel.english_name || channel.name },
                { name: "Organization", value: channel.org || "None" },
                { name: "Sub-organization", value: channel.suborg || "None" },
                { name: "Total view count", value: channel.view_count },
                { name: "Total video count", value: channel.video_count },
                { name: "Subscribers", value: channel.subscriber_count },
                { name: "Inactive", value: channel.inactive ? "Yes" : "No" },
            )
            .setFooter("Meteorium | Developed by RadiatedExodus (RealEthanPlayzDev)")
    ] })
}, new SlashCommandBuilder()
    .setName("getholodexchannelinfo")
    .setDescription("Get a channel info from holodex (https://holodex.net)")
    .addStringOption(option => option.setName("channelid").setDescription("The target channel id").setRequired(true)));