import { SlashCommandBuilder } from "discord.js";
import type { MeteoriumChatCommand } from "../../index.js";
import { GuildFeatures } from "@prisma/client";
import MeteoriumEmbedBuilder from "../../../classes/embedBuilder.js";

export const Command: MeteoriumChatCommand = {
    interactionData: new SlashCommandBuilder()
        .setName("music")
        .setDescription("Meteorium music functionality")
        .addSubcommand((subcommand) =>
            subcommand
                .setName("play")
                .setDescription("Play sound/music from YouTube")
                .addStringOption((option) =>
                    option
                        .setName("query")
                        .setDescription("A link/search term to the target YouTube video")
                        .setRequired(true),
                ),
        )
        .addSubcommand((subcommand) => subcommand.setName("stop").setDescription("Stop and disconnect the bot"))
        .addSubcommand((subcommand) => subcommand.setName("pause").setDescription("Pause the current track"))
        .addSubcommand((subcommand) => subcommand.setName("resume").setDescription("Resumes the current track"))
        .addSubcommand((subcommand) =>
            subcommand
                .setName("volume")
                .setDescription("Set the volume of the music player")
                .addNumberOption((option) =>
                    option
                        .setName("percent")
                        .setDescription(
                            "Volume percentage (1-100), if not specified then will reply with current volume.",
                        )
                        .setRequired(false),
                ),
        )
        .addSubcommand((subcommand) =>
            subcommand.setName("queue").setDescription("Get the queue of songs in this server"),
        )
        .addSubcommand((subcommand) => subcommand.setName("clearqueue").setDescription("Clears the queue"))
        .addSubcommand((subcommand) => subcommand.setName("skip").setDescription("Skips the current track"))
        .addSubcommand((subcommand) => subcommand.setName("back").setDescription("Goes back to the previous track"))
        .setDMPermission(false),
    requiredFeature: GuildFeatures.Music,
    async callback(interaction, client) {
        await interaction.deferReply({ ephemeral: false });

        if (!interaction.guild.available)
            return await interaction.editReply({
                content: "Guild/server not available. (Is there a outage at the moment?)",
            });

        const subcommand = interaction.options.getSubcommand();
        let playerNode = client.player.nodes.get(interaction.guildId);

        switch (subcommand) {
            case "play": {
                const query = interaction.options.getString("query", true);
                const channel = interaction.member.voice.channel;
                if (!channel)
                    return await interaction.editReply({
                        content: "You are not in a voice channel.",
                    });

                if (
                    interaction.guild.members.me?.voice.channelId &&
                    interaction.member.voice.channelId !== interaction.guild.members.me?.voice.channelId
                )
                    return await interaction.editReply({
                        content: "You are not in the same voice channel.",
                    });

                const search = await client.player.search(query, {
                    requestedBy: interaction.user,
                });
                if (!search.hasTracks())
                    return await interaction.editReply({
                        content: "No tracks found.",
                    });

                await client.player.play(channel, search, {
                    nodeOptions: {
                        metadata: interaction,
                        selfDeaf: true,
                        leaveOnEmpty: true,
                        leaveOnEnd: true,
                    },
                });

                return await interaction.editReply({
                    content: `Now playing: ${query}`,
                });
            }
            case "stop": {
                if (!playerNode)
                    return await interaction.editReply({
                        content: "The bot isn't connected to any voice channel.",
                    });
                playerNode.delete();
                return await interaction.editReply({
                    content: "Stopped and disconnected the bot.",
                });
            }
            case "pause": {
                if (!playerNode)
                    return await interaction.editReply({
                        content: "The bot isn't connected to any voice channel.",
                    });
                playerNode.node.pause();
                return await interaction.editReply({
                    content: "Paused the queue.",
                });
            }
            case "resume": {
                if (!playerNode)
                    return await interaction.editReply({
                        content: "The bot isn't connected to any voice channel.",
                    });
                playerNode.node.resume();
                return await interaction.editReply({
                    content: "Resumed the queue.",
                });
            }
            case "volume": {
                const percent = interaction.options.getNumber("percent", false);
                if (!playerNode)
                    return await interaction.editReply({
                        content: "The bot isn't connected to any voice channel.",
                    });
                if (!percent)
                    return await interaction.editReply({
                        content: `The current volume is ${playerNode.node.volume}%`,
                    });
                if (percent < 0 || percent > 100)
                    return await interaction.editReply({
                        content: "The volume must be betweeen 1% and 100%",
                    });
                playerNode.node.setVolume(percent);
                return await interaction.editReply({
                    content: `Set the volume to ${percent}%`,
                });
            }
            case "queue": {
                if (!playerNode)
                    return await interaction.editReply({
                        content: "The bot isn't connected to any voice channel.",
                    });
                if (!playerNode || (!playerNode.node.isPlaying() && playerNode.tracks.size === 0))
                    return await interaction.editReply({
                        content: "The queue is empty.",
                    });

                const tracks = playerNode.tracks
                    .toArray()
                    .slice(0, 25)
                    .map((track, i) => {
                        return `${i + 1}. [**${track.title}**](${track.url}) - ${track.requestedBy}`;
                    });

                const embed = new MeteoriumEmbedBuilder(interaction.user)
                    .setTitle("Player queue")
                    .setDescription(`(Only the first 25 tracks are listed)\n\n${tracks.join("\n")}`);

                return await interaction.editReply({ embeds: [embed] });
            }
            case "clearqueue": {
                if (!playerNode)
                    return await interaction.editReply({
                        content: "The bot isn't connected to any voice channel or the queue is empty.",
                    });
                playerNode.clear();
                return await interaction.editReply({
                    content: "Cleared the queue.",
                });
            }
            case "skip": {
                if (!playerNode)
                    return await interaction.editReply({
                        content: "The bot isn't connected to any voice channel.",
                    });
                const AmountOfTracksToSkip = interaction.options.getNumber("amountoftracks", false);
                if (!AmountOfTracksToSkip) {
                    playerNode.node.skip();
                    return interaction.editReply({
                        content: "Skipped the current track.",
                    });
                } else {
                    playerNode.node.skipTo(AmountOfTracksToSkip);
                    return interaction.editReply({
                        content: `Skipped ${AmountOfTracksToSkip} tracks.`,
                    });
                }
            }
            case "back": {
                if (!playerNode)
                    return await interaction.editReply({
                        content: "The bot isn't connected to any voice channel.",
                    });
                playerNode.history.back();
                return await interaction.editReply({
                    content: "Now playing the previous track.",
                });
            }
            default: {
                return await interaction.editReply({ content: `BUG: unknown subcommand ${subcommand}` });
            }
        }
    },
};
