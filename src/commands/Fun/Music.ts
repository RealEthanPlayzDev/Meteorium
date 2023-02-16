import { SlashCommandBuilder } from 'discord.js';
import { QueryType } from "discord-player"; 
import { stream } from 'play-dl';
import { YouTube } from 'youtube-sr';
import type { MeteoriumCommand } from "..";
import { MeteoriumEmbedBuilder } from '../../util/MeteoriumEmbedBuilder';

export const Command: MeteoriumCommand = {
    InteractionData: new SlashCommandBuilder()
        .setName("music")
        .setDescription("Command to control music related functions")
        .addSubcommand(subcommand => subcommand.setName("play")
                                               .setDescription("Play sound/music from YouTube")
                                               .addStringOption(option => option.setName("query").setDescription("A link/search term to the target YouTube video").setRequired(true))
                    )
        .addSubcommand(subcommand => subcommand.setName("lyrics")
                                               .setDescription("Attempt to search for a song lyrics for the current song or a specific song")
                                               .addStringOption(option => option.setName("songtitle").setDescription("Title for a specific song to search for it's lyrics").setRequired(false))
                    )
        .addSubcommand(subcommand => subcommand.setName("volume")
                                               .setDescription("Set the volume of the music player")
                                               .addNumberOption(option => option.setName("volumepercentage").setDescription("Volume percentage (1-100), if not specified then will reply with current volume.").setRequired(false))
                    )
        .addSubcommand(subcommand => subcommand.setName("resume").setDescription("Resumes the current track"))
        .addSubcommand(subcommand => subcommand.setName("pause").setDescription("Pause the current track"))
        .addSubcommand(subcommand => subcommand.setName("stop").setDescription("Stop and disconnect the bot"))
        .addSubcommand(subcommand => subcommand.setName("skip").setDescription("Skips the current track"))
        .addSubcommand(subcommand => subcommand.setName("queue").setDescription("Get the queue of songs in this server"))
        .addSubcommand(subcommand => subcommand.setName("clearqueue").setDescription("Clears the queue")),
    async Callback(interaction, client) {
        const Ephemeral = interaction.options.getBoolean("ephemeral", false) ? true : false;
        await interaction.deferReply({ ephemeral: Ephemeral });

        // Check subcommand and queue
        const SubcommandTarget = interaction.options.getSubcommand();
        let Queue = client.Player.getQueue(interaction.guildId);

        // Fetching guild members
        if (!interaction.guild.available) return await interaction.editReply({ content: "Guild/server not available. (Is there a outage at the moment?)" });
        
        switch(SubcommandTarget) {
            case("play"): {
                if (!interaction.member.voice.channelId) return await interaction.reply({ content: "You are not in a voice channel!" });
                if (interaction.guild.members.me?.voice.channelId && interaction.member.voice.channelId !== interaction.guild.members.me?.voice.channelId) return await interaction.reply({ content: "You are not in the same voice channel!" });
                const Query = interaction.options.getString("query", true);

                // Creating a queue object
                Queue = await client.Player.createQueue(interaction.guild, {
                    metadata: interaction.channel,
                    spotifyBridge: true,
                    async onBeforeCreateStream(track, _, __) {
                        return (await stream(await YouTube.search(`${track.author} ${track.title}`, { type: "video" }).then(x => {
                            let Index = 0, Url = "";
                            while (Index >= x.length) {
                                if (x[Index] == undefined) {
                                    if (Index > 30) break;
                                    Index += 1;
                                } else {
                                    const IndexedVideo = x[Index];
                                    Url = IndexedVideo ? IndexedVideo.url : "";
                                    break;
                                }
                            }
                            return Url;
                        }), { discordPlayerCompatibility : true })).stream;
                    }
                })

                // Try connecting to a voice channel
                try {
                    if (!interaction.member.voice.channel) throw Error("member.voice.channel === undefined, can't continue");
                    if (!Queue.connection && interaction.member.voice.channel) await Queue.connect(interaction.member.voice.channel);
                } catch(e) {
                    Queue.destroy();
                    console.error(`Music command connect fail:\n${e}`);
                    return await interaction.editReply({ content: "Error occured while connecting to the voice channel.\nPlease try again later" });
                }

                // Searching and adding to the queue
                const SearchResult = await client.Player.search(Query, {
                    requestedBy: interaction.user,
                    searchEngine: QueryType.AUTO
                });
                Queue.addTracks(SearchResult.tracks);

                // Check play state
                if (!Queue.playing) {
                    Queue.play();
                }

                return await interaction.editReply({ content: `Added "${Query}" to the queue` });
            }
            case("lyrics"): {
                // const SongTitle = interaction.options.getString("songtitle", false);
                return await interaction.editReply({ content: "Unfortunately, this functionality is disabled right now due to it's unusability, it may or may not be removed in the future." })
            }
            case("volume"): {
                const VolumePercentage = interaction.options.getNumber("volumepercentage", false);
                if (!Queue) return await interaction.editReply({ content: "The bot isn't connected to any voice channel." });
                if (!VolumePercentage) return await interaction.editReply({ content: `The current volume is ${Queue.volume}%` });
                if (VolumePercentage < 0 || VolumePercentage > 100) return await interaction.editReply({ content: "The volume must be betweeen 1% and 100%" });
                Queue.setVolume(VolumePercentage);
                return await interaction.editReply({ content: `Set the volume to ${VolumePercentage}%` });
            }
            case("resume"): {
                if (!Queue) return await interaction.editReply({ content: "The bot isn't connected to any voice channel." });
                Queue.setPaused(false);
                return await interaction.editReply({ content: "Resumed the queue." });
            }
            case("pause"): {
                if (!Queue) return await interaction.editReply({ content: "The bot isn't connected to any voice channel." });
                Queue.setPaused(true);
                return await interaction.editReply({ content: "Paused the queue." });
            }
            case("stop"): {
                if (!Queue) return await interaction.editReply({ content: "The bot isn't connected to any voice channel." });
                Queue.destroy();
                return await interaction.editReply({ content: "Stopped and disconnected the bot." });
            }
            case("skip"): {
                if (!Queue) return await interaction.editReply({ content: "The bot isn't connected to any voice channel." });
                const AmountOfTracksToSkip = interaction.options.getNumber("amountoftracks", false);
                if (!AmountOfTracksToSkip) {
                    Queue.skip();
                    return interaction.editReply({ content: "Skipped the current track." });
                } else {
                    Queue.skipTo(AmountOfTracksToSkip);
                    return interaction.editReply({ content: `Skipped ${AmountOfTracksToSkip} tracks.` });
                }
            }
            case("queue"): {
                if (!Queue) return await interaction.editReply({ content: "The bot isn't connected to any voice channel." });
                const CurrentTrack = Queue.current;
                const QueueTracks = Queue.tracks.slice(0, 25).map((m, i) => {
                    return `${i + 1}. [**${m.title}**](${m.url}) - ${
                        m.requestedBy.tag
                    }`;
                });
                
                return await interaction.editReply({
                    embeds: [
                        new MeteoriumEmbedBuilder(undefined, interaction.user)
                            .setTitle("Music/sound queue")
                            .setDescription(`${QueueTracks.join("\n")}${
                                Queue.tracks.length > QueueTracks.length
                                    ? `\n...${
                                        Queue.tracks.length - QueueTracks.length === 1
                                            ? `${
                                                Queue.tracks.length - QueueTracks.length
                                            } more track`
                                            : `${
                                                Queue.tracks.length - QueueTracks.length
                                            } more tracks`
                                    }`
                                    : ""
                            }`)
                            .addFields([ { name: "Now playing", value: `${CurrentTrack.title} - ${CurrentTrack.url} ${CurrentTrack.requestedBy.tag}` } ])
                    ]
                });
            }
            case("clearqueue"): {
                if (!Queue) return await interaction.editReply({ content: "The bot isn't connected to any voice channel." });
                Queue.clear();
                return await interaction.editReply({ content: "Cleared the queue." });
            }
        }
        return;
    }
}