const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const MeteoriumCommand = require("../../util/Command");
const { QueryType } = require("discord-player");
const playdl = require("play-dl");

module.exports = new MeteoriumCommand("play", "Play sound/music from YouTube", async (interaction, client) => {
    if (!interaction.member.voice.channelId) return await interaction.reply({ content: "You are not in a voice channel!" });
    if (interaction.guild.me.voice.channelId && interaction.member.voice.channelId !== interaction.guild.me.voice.channelId) return await interaction.reply({ content: "You are not in my voice channel!" });
    await interaction.deferReply();
    const query = interaction.options.getString("query", true);
    const queue = await client.Player.createQueue(interaction.guild, {
        metadata: interaction.channel,
        spotifyBridge: true,
        async onBeforeCreateStream(track, source, _queue) {
            if (source === "youtube") {
                return (await playdl.stream(track.url, { discordPlayerCompatibility: true })).stream;
            } else if(source === "soundcloud") {
                return (await playdl.stream(track.url, { discordPlayerCompatibility: true })).stream;
            } else {
                return (await playdl.stream(await playdl.search(`${track.author} ${track.title} lyric`, { limit : 1, source : { youtube : "video" } }).then(x => x[0].url), { discordPlayerCompatibility : true })).stream;
            }
        }
    });

    try {
        if (!queue.connection) await queue.connect(interaction.member.voice.channel);
    } catch(e) {
        queue.destroy();
        return await interaction.reply({ embeds: [
            new MessageEmbed()
                .setTitle("Couldn't connext to voice chat!")
                .setDescription(`An error occured when attempting to join the voice chat:\n${e}`)
                .setColor("FF0000")
                .setFooter("Meteorium | Developed by RadiatedExodus (RealEthanPlayzDev)")
                .setTimestamp()
        ]})
    }

    const sr = await client.Player.search(query, {
        requestedBy: interaction.user,
        searchEngine: QueryType.AUTO
    });
    sr.playlist ? queue.addTracks(sr.tracks) : queue.addTrack(sr.tracks[0]);
    if (!queue.playing) {
        await queue.play();
    }

    return await interaction.followUp({ embeds: [
        new MessageEmbed()
            .setTitle("Playing")
            .setDescription(query)
            .setColor("0099ff")
            .setFooter("Meteorium | Developed by RadiatedExodus (RealEthanPlayzDev)")
            .setTimestamp()
    ]})
}, new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play sound/music from YouTube")
    .addStringOption(option => option.setName("query").setDescription("A link/search term to the target YouTube video").setRequired(true)))
    //.addChannelOption(option => option.setName("voicechannel").setDescription("Target voice channel").setRequired(false)))
