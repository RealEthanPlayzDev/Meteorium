import { SlashCommandBuilder } from 'discord.js';
import { HolodexApiClient } from 'holodex.js';
import type { MeteoriumCommand } from "..";
import { MeteoriumEmbedBuilder } from '../../util/MeteoriumEmbedBuilder';

let HolodexClient = new HolodexApiClient({ apiKey: "" });
let ClientNeedsResetup = true;

export const Command: MeteoriumCommand = {
    InteractionData: new SlashCommandBuilder()
        .setName("holodexapi")
        .setDescription("Shows information about a vtuber/vtuber's video. (Powered by https://holodex.net)")
        .addSubcommand(subcommand => subcommand.setName("getchannelinfo")
                                               .setDescription("Gets information about a vtuber's channel")
                                               .addStringOption(option => option.setName("channelid").setDescription("The vtuber's YouTube channel id").setRequired(true))
                                               .addBooleanOption(option => option.setName("ephemeral").setDescription("If true, the response will be only shown to you").setRequired(false))
                     )
        .addSubcommand(subcommand => subcommand.setName("getvideoinfo")
                                               .setDescription("Gets information about a vtuber's video")
                                               .addStringOption(option => option.setName("videoid").setDescription("The vtuber's YouTube video id").setRequired(true))
                                               .addBooleanOption(option => option.setName("ephemeral").setDescription("If true, the response will be only shown to you").setRequired(false))
        ),
    async Callback(interaction, client) {
        const Ephemeral = interaction.options.getBoolean("ephemeral", false) ? true : false;
        await interaction.deferReply({ ephemeral: Ephemeral });
        if (ClientNeedsResetup) HolodexClient = new HolodexApiClient({ apiKey: client.Config.HolodexAPIKey });

        const SubcommandTarget = interaction.options.getSubcommand();
        switch(SubcommandTarget) {
            case("getchannelinfo"): {
                const Channel = (await HolodexClient.getChannel(interaction.options.getString("channelid", true))).toRaw();
                const Embed = new MeteoriumEmbedBuilder(undefined, interaction.user)
                    .setTitle("Channel")
                    .setDescription("A channel")
                    .setAuthor({ name: Channel.name, url: `https://www.youtube.com/channel/${Channel.id}` })
                    .addFields([
                        { name: "English name", value: Channel.english_name || Channel.name },
                        { name: "Organization", value: Channel.org || "None" },
                        { name: "Sub-organization", value: Channel.suborg || "None" },
                        { name: "Inactive", value: Channel.inactive ? "Yes" : "No" },
                    ]);

                if (Channel?.view_count) Embed.addFields([ { name: "Total view count", value: Channel.view_count } ]);
                if (Channel?.video_count) Embed.addFields([ { name: "Total video count", value: Channel.video_count } ]);
                if (Channel?.subscriber_count) Embed.addFields([ { name: "Subscribers", value: Channel.subscriber_count } ]);
                if (Channel?.photo) Embed.setThumbnail(Channel.photo);

                await interaction.editReply({ embeds: [ Embed ] });
                break;
            }
            case("getvideoinfo"): {
                const Video = (await HolodexClient.getVideo(interaction.options.getString("videoid", true))).toRaw();
                
                const Embed = new MeteoriumEmbedBuilder(undefined, interaction.user)
                    .setTitle("Video")
                    .setDescription(`By ${Video.channel.name}`)
                    .setAuthor({ name: Video.title, url: `https://www.youtube.com/watch?v=${Video.id}` })
                    .addFields([
                        // Video metadata
                        { name: `Video link`, value: `https://www.youtube.com/watch?v=${Video.id}` },
                        { name: "Video type", value: Video.type },
                        { name: "Status", value: Video.status },
                        { name: "Video topic id", value: Video.topic_id ? Video.topic_id : "None" },
                        { name: "Video duration", value: String(Video.duration) }
                    ]);
                
                if (Video.songs) {
                    let Songs = "";
                    if (Video.songs) {
                        for (const Song of Video.songs) {
                            let str = `Name: ${Song.name}\nOriginal artist: ${Song.original_artist}\niTunes id: ${Song.itunesid ? Song.itunesid : "Unknown/None"}\nSong duration: ${Song.end}`;
                            if (Songs === "") {
                                Songs = str
                            } else {
                                Songs += "\n" + str
                            }
                        }
                    }
                    if (Songs === "") Songs = "No songs";
                    Embed.addFields([ { name: `Songs (${Songs.length} total)`, value: (Songs === "" ? "Unable to parse song/No songs available" : Songs) } ]);
                }

                Embed.addFields([
                    // Anything related to time/date
                    { name: "Published at", value: Video.published_at ? Video.published_at : "Unknown date" },
                    { name: "Available at", value: Video.available_at ? Video.available_at : "Unknown date" }
                ]);

                if (Video.start_scheduled) Embed.addFields([ { name: "Scheduled premiere start time", value: Video.start_scheduled } ]);
                if (Video.start_actual) Embed.addFields([ { name: "Premiere started at", value: Video.start_actual } ]);
                if (Video.end_actual) Embed.addFields([ { name: "Premiere ended at", value: Video.end_actual } ]);

                Embed.addFields([
                    // Channel info
                    { name: "Channel name", value: Video.channel.name },
                    { name: "Channel English name", value: Video.channel.english_name ? Video.channel.english_name : "No English version of the name" }
                ]);

                if (Video.channel.org) Embed.addFields([ { name: "Channel organization", value: Video.channel.org === "" ? "Independent" : Video.channel.org } ]);
                if (Video.channel.suborg) Embed.addFields([ { name: "Channel suborganization", value: Video.channel.suborg === "" ? "Independent" : Video.channel.suborg } ]);

                Embed.addFields([
                    { name: "Channel link", value: `https://www.youtube.com/channel/${Video.channel.id}` },
                    { name: "For more information about the channel", value: "Do the command ``/holodexapi getchannelinfo channelid:"+Video.channel.id+"``" }
                ]);
                
                if (Video.channel?.photo) Embed.setThumbnail(Video.channel.photo === "" ? "No channel photo" : Video.channel.photo);

                await interaction.editReply({ embeds: [ Embed ] });
                break;
            }
        }
        return;
    }
}