import { SlashCommandBuilder } from 'discord.js';
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
        .addSubcommand(subcommand => subcommand.setName("bassboost")
                                               .setDescription("Bass boost filter toggle")
                                               .addBooleanOption(option => option.setName("enabled").setDescription("Whether bass boost is enabled or not, if not specified, returns the current enabled state.").setRequired(false))
                    )
        .addSubcommand(subcommand => subcommand.setName("currenttrack").setDescription("Gets information about the current track"))
        .addSubcommand(subcommand => subcommand.setName("back").setDescription("Goes back to the previous track"))
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

        // Get the current queue node
        let Queue = client.DiscordPlayer.nodes.get(interaction.guildId);

        // Fetching guild members
        if (!interaction.guild.available) return await interaction.editReply({ content: "Guild/server not available. (Is there a outage at the moment?)" });
        
        switch(SubcommandTarget) {
            case("play"): {
                const Query = interaction.options.getString("query", true);
                const VoiceChannel = interaction.member.voice.channel
                if (!VoiceChannel) return await interaction.reply({ content: "You are not in a voice channel!" });
                if (interaction.guild.members.me?.voice.channelId && interaction.member.voice.channelId !== interaction.guild.members.me?.voice.channelId) return await interaction.reply({ content: "You are not in the same voice channel!" });

                const SearchResult = await client.DiscordPlayer.search(Query, { requestedBy: interaction.user });
                if (!SearchResult.hasTracks()) return await interaction.reply({ content: "Found no tracks for this query." });

                try {
                    await client.DiscordPlayer.play(VoiceChannel, SearchResult, {
                        nodeOptions: {
                            metadata: interaction,
                            selfDeaf: true,
                            leaveOnEmpty: true,
                            leaveOnEnd: true
                        }
                    })
                } catch(e) {
                    console.error(`Error occured while trying to play on discord-player: ${e}`);
                    return await interaction.editReply({ content: "An error has occured while trying to play your query." });
                }

                return await interaction.editReply({ content: `Now playing your query (${Query})` });
            }
            case("lyrics"): {
                const lyrics = await client.LyricsExtractor.search('alan walker faded').catch(() => null);
                if (!lyrics) return await interaction.editReply({ content: "No lyrics found." });
                const TrimmedLyrics = lyrics.lyrics.substring(0, 1997);

                const Embed = new MeteoriumEmbedBuilder(undefined, interaction.user)
                                    .setTitle(lyrics.title)
                                    .setURL(lyrics.url)
                                    .setThumbnail(lyrics.thumbnail)
                                    .setAuthor({
                                        name: lyrics.artist.name,
                                        iconURL: lyrics.artist.image,
                                        url: lyrics.artist.url
                                    })
                                    .setDescription(TrimmedLyrics.length === 1997 ? `${TrimmedLyrics}...` : TrimmedLyrics);

                return await interaction.editReply({ embeds: [ Embed ] });
            }
            case("volume"): {
                const VolumePercentage = interaction.options.getNumber("volumepercentage", false);
                if (!Queue) return await interaction.editReply({ content: "The bot isn't connected to any voice channel." });
                if (!VolumePercentage) return await interaction.editReply({ content: `The current volume is ${Queue.node.volume}%` });
                if (VolumePercentage < 0 || VolumePercentage > 100) return await interaction.editReply({ content: "The volume must be betweeen 1% and 100%" });
                Queue.node.setVolume(VolumePercentage);
                return await interaction.editReply({ content: `Set the volume to ${VolumePercentage}%` });
            }
            case("bassboost"): {
                return await interaction.editReply({ content: "TODO: Rewrite for discord-player v6.x.x" });
            }
            case("currenttrack"): {
                if (!Queue) return await interaction.editReply({ content: "The bot isn't connected to any voice channel." });
                if (!Queue.currentTrack) return await interaction.editReply({ content: "The bot isn't playing anything." });
                const Track = Queue.currentTrack
                const Embed = new MeteoriumEmbedBuilder(undefined, interaction.user)
                                    .setTitle(Track.title)
                                    .setDescription(`${Track.author} - ${Track.title}`)
                                    .setThumbnail(Track.thumbnail)
                                    .setURL(Track.url)
                                    .addFields([
                                        { name: "Author", value: String(Track.author) },
                                        { name: "Duration", value: String(Track.duration) },
                                        { name: "Requested by", value: String(Track.requestedBy) },
                                        { name: "Views", value: String(Track.views) },
                                        { name: "Id", value: String(Track.id) }
                                    ]);
                return await interaction.editReply({ embeds: [ Embed ] });
            }
            case("back"): {
                if (!Queue) return await interaction.editReply({ content: "The bot isn't connected to any voice channel." });
                Queue.history.back();
                return await interaction.editReply({ content: "Now playing the previous track." });
            }
            case("resume"): {
                if (!Queue) return await interaction.editReply({ content: "The bot isn't connected to any voice channel." });
                Queue.node.resume();
                return await interaction.editReply({ content: "Resume the queue." });
            }
            case("pause"): {
                if (!Queue) return await interaction.editReply({ content: "The bot isn't connected to any voice channel." });
                Queue.node.pause();
                return await interaction.editReply({ content: "Paused the queue." });
            }
            case("stop"): {
                if (!Queue) return await interaction.editReply({ content: "The bot isn't connected to any voice channel." });
                Queue.delete();
                return await interaction.editReply({ content: "Stopped and disconnected the bot." });
            }
            case("skip"): {
                if (!Queue) return await interaction.editReply({ content: "The bot isn't connected to any voice channel." });
                const AmountOfTracksToSkip = interaction.options.getNumber("amountoftracks", false);
                if (!AmountOfTracksToSkip) {
                    Queue.node.skip();
                    return interaction.editReply({ content: "Skipped the current track." });
                } else {
                    Queue.node.skipTo(AmountOfTracksToSkip);
                    return interaction.editReply({ content: `Skipped ${AmountOfTracksToSkip} tracks.` });
                }
            }
            case("queue"): {
                if (!Queue) return await interaction.editReply({ content: "The bot isn't connected to any voice channel." });
                if (!Queue || !Queue.node.isPlaying() && Queue.tracks.size === 0) return await interaction.editReply({ content: "The bot isn't playing anything and there is nothing at the queue." });
                const CurrentTrack = Queue.currentTrack;
                const QueueTracks = Queue.tracks.toArray().slice(0, 25).map((track, i) => {
                    return `${i + 1}. [**${track.title}**](${track.url}) - ${track.requestedBy}`;
                });

                const Embed = new MeteoriumEmbedBuilder(undefined, interaction.user)
                                    .setTitle("Music/sound queue")
                                    .setDescription(`Keep in mind only the first 25 music(s)/sound(s) are listed here:\n${QueueTracks.join("\n")}`);
                if (CurrentTrack) Embed.setFields({ name: "Currently playing", value: `[**${CurrentTrack.title}**](${CurrentTrack.url}) - ${CurrentTrack.requestedBy}` });

                return await interaction.editReply({ embeds: [ Embed ] });
            }
            case("clearqueue"): {
                if (!Queue) return await interaction.editReply({ content: "The bot isn't connected to any voice channel or the queue is empty." });
                Queue.clear();
                return await interaction.editReply({ content: "TODO: Rewrite for discord-player v6.x.x" });
            }
        }
        return;
    }
}