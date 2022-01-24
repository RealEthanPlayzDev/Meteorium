const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const MeteoriumCommand = require("../../util/Command");
const { Player } = require("discord-player")

module.exports = new MeteoriumCommand("play", "Play sound/music from YouTube", async (interaction, client) => {
    if (!interaction.member.voice.channelId) return await interaction.reply({ content: "You are not in a voice channel!", ephemeral: true });
    if (interaction.guild.me.voice.channelId && interaction.member.voice.channelId !== interaction.guild.me.voice.channelId) return await interaction.reply({ content: "You are not in my voice channel!", ephemeral: true });
    await interaction.deferReply();
    const query = interaction.options.getString("query", true);
    const queue = await client.Player.createQueue(interaction.guild, {
        metadata: interaction.channel
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

    const track = await client.Player.search(query, {
        requestedBy: interaction.user
    }).then(x => x.tracks[0]);
    if (!track) return await interaction.followUp({ content: `❌ | Track **${query}** not found!` });
    queue.play(track);

    return await interaction.followUp({ embeds: [
        new MessageEmbed()
            .setTitle("Loading and playing")
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