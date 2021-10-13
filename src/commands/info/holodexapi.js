const { SlashCommandBuilder } = require("@discordjs/builders");
const MeteoriumCommand = require("../../util/Command");
const { HolodexApiClient } = require("holodex.js");
const { holodexApiKey } = require("../../../config.json");
const { MessageEmbed } = require("discord.js");
const holodexClient = new HolodexApiClient({
    apiKey: holodexApiKey || ""
});

module.exports = new MeteoriumCommand("holodexapi", "Holodex API - See subcommands (Powered by https://holodex.net)", async (interaction, client) => {
    await interaction.deferReply();
    if (interaction.options.getSubcommand() === "getchannelinfo") {
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
                .setColor("0099ff")
                .setTimestamp()
        ]});
    } else if (interaction.options.getSubcommand() === "getvideoinfo") {
        const video = (await holodexClient.getVideo(interaction.options.getString("videoid"), false)).toRaw();

        // Song parsing
        var songs = "";
        if (video.songs) {
            for (const song of video.songs) {
                var str = `Name: ${song.name}\nOriginal artist: ${song.original_artist}\niTunes id: ${song.itunesid ? song.itunesid : "Unknown/None"}\nSong duration: ${song.end}`;
                if (songs === "") {
                    songs = str
                } else {
                    songs += "\n" + str
                }
            }
        }
        if (songs === "") { songs = "No songs" }

        console.log(video);
        await interaction.editReply({ embeds: [
            new MessageEmbed()
                .setAuthor(video.title, null, `https://www.youtube.com/watch?v=${video.id}`)
                .setThumbnail((video.channel.photo === "" && "a" || video.channel.photo))
                .setDescription((video.description === "" && "(No description available)" || video.description))
                .addFields(
                    // Video metadata
                    { name: `Video link`, value: `https://www.youtube.com/watch?v=${video.id}` },
                    { name: `Songs (${(video.songs === undefined && "0" || video.songs.length)} total)`, value: (songs === "" && "Unable to parse song/No songs available" || songs) },
                    { name: "Video type", value: (video.type === "" && "Unknown" || video.type) },
                    { name: "Status", value: (video.status === "" && "Unknown" || video.status) },
                    { name: "Video topic id", value: (video.topic_id === undefined && "None" || video.topic_id) },
                    { name: "Video duration", value: (video.duration === 0 && "0" || String(video.duration)) },

                    // Anything related to time/date
                    { name: "Published at", value: (video.published_at === "" && "Unknown date" || video.published_at) },
                    { name: "Available at", value: (video.available_at === "" && "Unknown date" || video.available_at) },
                    { name: "Scheduled premiere start time", value: (video.start_scheduled === undefined && "Unknown date (Possibly not a premiere)" || video.start_scheduled) },
                    { name: "Premiere started at", value: (video.start_actual === undefined && "Unknown date (Possibly not a premiere)" || video.start_actual) },
                    { name: "Premiere ended at", value: (video.end_actual === undefined && "Unknown date (Possibly not a premiere)" || video.end_actual) },

                    // Channel info
                    { name: "Channel name", value: video.channel.name },
                    { name: "Channel English name", value: video.channel.english_name },
                    { name: "Channel organization", value: (video.channel.org === "" && "Independent" || video.channel.org) },
                    { name: "Channel suborganization", value: (video.channel.suborg === "" || video.channel.suborg === undefined && "Independent" || video.channel.suborg) },
                    { name: "Channel link", value: `https://www.youtube.com/channel/${video.channel.id}` },
                    { name: "For more information about the channel", value: "Do the command ``/holodexapi getchannelinfo channelid:"+video.channel.id+"``" },
                )
                .setFooter("Meteorium | Developed by RadiatedExodus (RealEthanPlayzDev)")
                .setColor("0099ff")
                .setTimestamp()
        ]});
    }
}, new SlashCommandBuilder()
    .setName("holodexapi")
    .setDescription("Holodex API - See subcommands (Powered by https://holodex.net)")
    .addSubcommand(subcommand => subcommand.setName("getchannelinfo")
                                        .setDescription("Gets a channel info from Holodex (Powered by https://holodex.net)")
                                        .addStringOption(option => option.setName("channelid").setDescription("The target channel id").setRequired(true)))
    .addSubcommand(subcommand => subcommand.setName("getvideoinfo")
                                        .setDescription("Gets video info from Holodex (Powered by https://holodex.net)")
                                        .addStringOption(option => option.setName("videoid").setDescription("The target video id").setRequired(true))));