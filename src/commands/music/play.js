// TODO: Make a new class for representing music system instead.
const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const MeteoriumCommand = require("../../util/Command");
const ytdl = require("ytdl-core");
const { AudioPlayerStatus, StreamType, createAudioPlayer, createAudioResource, joinVoiceChannel } = require('@discordjs/voice');

module.exports = new MeteoriumCommand("play", "Play sound/music from YouTube", async (interaction, client) => {
    const link = interaction.options.getString("link"), vc = interaction.options.getChannel("voicechannel")
    const connection = joinVoiceChannel({
        channelId: vc.id,
        guildId: interaction.guildId,
        adapterCreator: interaction.guild.voiceAdapterCreator
    })
    const stream = ytdl(link, { filter: 'audioonly' });
    const resource = createAudioResource(stream, { inputType: StreamType.Arbitrary });
    const player = createAudioPlayer();
    player.play(resource);
    connection.subscribe(player);
    player.on(AudioPlayerStatus.Idle, () => connection.destroy());
    await interaction.reply({ embeds: [
        new MessageEmbed()
            .setTitle("Playing")
            .setDescription(link)
            .setColor("0099ff")
            .setFooter("Meteorium | Developed by RadiatedExodus (RealEthanPlayzDev)")
            .setTimestamp()
    ]})
}, new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play sound/music from YouTube")
    .addStringOption(option => option.setName("link").setDescription("A link to the target YouTube video").setRequired(true))
    .addChannelOption(option => option.setName("voicechannel").setDescription("Target voice channel").setRequired(false)))