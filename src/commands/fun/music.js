const { SlashCommandBuilder } = require("@discordjs/builders");
const { QueryType } = require("discord-player");
const playdl = require("play-dl");
const youtubesr = require("youtube-sr");
const Axios = require("axios");
const MeteoriumCommand = require("../../util/Command");
const MeteoriumEmbed = require("../../util/MeteoriumEmbed");

// Lyrics functions
function getLyrics(title) {
    return new Promise(async (ful, rej) => {
        const url = new URL("https://some-random-api.ml/lyrics");
        url.searchParams.append("title", title);
        console.log(url.href)

        try {
            const { data } = await Axios.get(url.href);
            ful(data);
        } catch (error) {
            rej(error);
        }
    });
}

function substring(length, value) {
    const replaced = value.replace(/\n/g, "--");
    const regex = `.{1,${length}}`;
    const lines = replaced
        .match(new RegExp(regex, "g"))
        .map((line) => line.replace(/--/g, "\n"));

    return lines;
}

async function createResponse(title) {
    try {
        const data = await getLyrics(title);

        const embed = substring(4096, data.lyrics).map((value, index) => {
            const isFirst = index === 0;
            return new MeteoriumEmbed(isFirst ? `${data.title} - ${data.author}` : "null?", value).setThumbnail(isFirst ? { url: data.thumbnail.genius } : "");
        });

        return embed;
    } catch (error) {
        return new MeteoriumEmbed("Error occured when finding lyrics", `Couldn't find any lyrics for this song!\n${error}`, "FF0000");
    }
}

// Export
module.exports = new MeteoriumCommand("music", "Meteorium's music management command", async (interaction, client) => {
    const subcommand = interaction.options.getSubcommand()
    var queue = client.Player.getQueue(interaction.guildId);
    if (!queue && !subcommand === "play") {
        return await interaction.reply({ content: "The bot doesn't seem to be connected to any voice channels." });
    }
    switch (subcommand) {
        case "play": {
            if (!interaction.member.voice.channelId) return await interaction.reply({ content: "You are not in a voice channel!" });
            if (interaction.guild.me.voice.channelId && interaction.member.voice.channelId !== interaction.guild.me.voice.channelId) return await interaction.reply({ content: "You are not in my voice channel!" });
            await interaction.deferReply();
            const query = interaction.options.getString("query", true);
            queue = await client.Player.createQueue(interaction.guild, {
                metadata: interaction.channel,
                spotifyBridge: true,
                async onBeforeCreateStream(track, source, _queue) {
                    return (await playdl.stream(await youtubesr.YouTube.search(`${track.author} ${track.title}`, {type: "video"}).then(x => x[0].url), { discordPlayerCompatibility : true })).stream;
                    /*
                    if (source === "youtube") {
                        return (await playdl.stream(track.url, { discordPlayerCompatibility: true })).stream;
                    } else if(source === "soundcloud") {
                        return (await playdl.stream(track.url, { discordPlayerCompatibility: true })).stream;
                    } else {
                        return (await playdl.stream(await playdl.search(`${track.author} ${track.title} lyric`, { limit : 1, source : { youtube : "video" } }).then(x => x[0].url), { discordPlayerCompatibility : true })).stream;
                    }
                    */
                }
            });

            try {
                if (!queue.connection) await queue.connect(interaction.member.voice.channel);
            } catch(e) {
                queue.destroy();
                return await interaction.reply({ embeds: [
                    new MeteoriumEmbed("Couldn't connext to voice chat!", `An error occured when attempting to join the voice chat:\n${e}`, "FF0000")
                ]});
            }

            const sr = await client.Player.search(query, {
                requestedBy: interaction.user,
                searchEngine: QueryType.AUTO
            });
            sr.playlist ? queue.addTracks(sr.tracks) : queue.addTrack(sr.tracks[0]);
            const isPlaying = queue.playing
            if (!isPlaying) {
                await queue.play();
            }

            return await interaction.followUp({ embeds: [
                new MeteoriumEmbed(isPlaying ? "Added to queue" : "Playing", query)
            ]})
        }
        case "lyrics" : {
            const specificsongtitle = interaction.options.getString("songtitle");
            await interaction.deferReply();
            if (specificsongtitle) {
                return await interaction.followUp({ embeds: [await createResponse(specificsongtitle)] })
            } else {
                if (!queue) {
                    return await interaction.followUp({ content: "The bot doesn't seem to be connected to any voice channels or nothing is playing, or you can use the specific song title option." });
                }
                if (!queue.playing) {
                    return await interaction.followUp({ content: "No songs are playing currently, you can use the specific song title option if you need a specific song instead." });
                }
                return await interaction.followUp({ embeds: [await createResponse(queue.current.title)] })
            }
        }
        case "volume" : {
            const volpercent = interaction.options.getNumber("volumepercentage");
            if (!queue?.playing) {
                return await interaction.reply({ embeds: [
                    new MeteoriumCommand("Nothing is in the music queue!", "The music queue is empty.", "FF0000")
                ]});
            }
            if (!volpercent) {
                return interaction.reply({content: `The current volume is ${queue.volume}%`,})
            }
            if (volpercent < 0 || volpercent > 100) {
                return interaction.reply({content: "The volume must be betweeen 1% and 100%",});
            }
            queue.setVolume(volpercent);
            return interaction.reply({content: `Set the volume to ${volpercent}%`})
        }
        case "resume" : {
            queue.setPaused(false);
            return interaction.reply({content: "Resumed the current track."});
        }
        case "pause" : {
            queue.setPaused(true);
            return interaction.reply({content: "Paused the current track."});
        }
        case "stop" : {
            queue.destroy(true);
            return await interaction.reply({ content: "Stopped and disconnected the bot." });
        }
        case "skip" : {
            const amountoftracks = interaction.options.getNumber("amountoftracks");
            if (!amountoftracks) {
                await queue.skip();
                return interaction.reply({content: "Skipped the current track."});
            } else {
                await queue.skipTo(amountoftracks);
                return interaction.reply({content: `Skipped ${amountoftracks} tracks.`});
            }
        }
        case "queue" : {
            const currentTrack = queue.current;
            const tracks = queue.tracks.slice(0, 25).map((m, i) => {
                return `${i + 1}. [**${m.title}**](${m.url}) - ${
                    m.requestedBy.tag
                }`;
            });
            
            return await interaction.reply({ embeds: [
                new MeteoriumEmbed("Music queue")
                    .setDescription(`${tracks.join("\n")}${
                        queue.tracks.length > tracks.length
                            ? `\n...${
                                queue.tracks.length - tracks.length === 1
                                    ? `${
                                        queue.tracks.length - tracks.length
                                    } more track`
                                    : `${
                                        queue.tracks.length - tracks.length
                                    } more tracks`
                            }`
                            : ""
                    }`)
                    .addField("Now playing", `${currentTrack.title} - ${currentTrack.url} ${currentTrack.requestedBy.tag}`)
            ]});
        }
        case "clearqueue" : {
            queue.clear();
            return await interaction.reply({ content: "Cleared the music queue." })
        }
        default: {
            console.log("Case switch statement fail")
            return interaction.reply("Case switch statement fail?")
        }
    }
}, new SlashCommandBuilder()
    .setName("music")
    .setDescription("Meteorium's music management command")
    .addSubcommand(subcommand => subcommand.setName("play").setDescription("Play sound/music from YouTube")
                                    .addStringOption(option => option.setName("query").setDescription("A link/search term to the target YouTube video").setRequired(true))
                )
    .addSubcommand(subcommand => subcommand.setName("lyrics").setDescription("Attempt to search for a song lyrics for the current song or a specific song")
                                    .addStringOption(option => option.setName("songtitle").setDescription("Title for a specific song to search for it's lyrics").setRequired(false))
                )
    .addSubcommand(subcommand => subcommand.setName("volume").setDescription("Set the volume of the music player")
                                    .addNumberOption(option => option.setName("volumepercentage").setDescription("Volume percentage (1-100), if not specified then will reply with current volume.").setRequired(false))
                )
    .addSubcommand(subcommand => subcommand.setName("resume").setDescription("Resumes the current track"))
    .addSubcommand(subcommand => subcommand.setName("pause").setDescription("Pause the current track"))
    .addSubcommand(subcommand => subcommand.setName("stop").setDescription("Stop and disconnect the bot"))
    .addSubcommand(subcommand => subcommand.setName("skip").setDescription("Skips the current track"))
    .addSubcommand(subcommand => subcommand.setName("queue").setDescription("Get the queue of songs in this server"))
    .addSubcommand(subcommand => subcommand.setName("clearqueue").setDescription("Clears the queue"))
)