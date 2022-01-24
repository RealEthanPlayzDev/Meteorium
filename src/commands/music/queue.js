const { MessageEmbed } = require("discord.js");
const MeteoriumCommand = require("../../util/Command");

module.exports = new MeteoriumCommand("queue", "Get the queue of songs in this server", async (interaction, client) => {
    const queue = client.Player.getQueue(interaction.guildId);
    if (!queue) {
        return await interaction.reply({ content: "The bot doesn't seem to be connected to any voice channels." });
    }
    const currentTrack = queue.current;
	const tracks = queue.tracks.slice(0, 25).map((m, i) => {
		return `${i + 1}. [**${m.title}**](${m.url}) - ${
			m.requestedBy.tag
		}`;
	});
    return await interaction.reply({ embeds: [
        new MessageEmbed()
            .setTitle("Music queue")
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
            .setColor("0099ff")
            .addField("Now playing", `${currentTrack.title} - ${currentTrack.url} ${currentTrack.requestedBy.tag}`)
            .setFooter("Meteorium | Developed by RadiatedExodus (RealEthanPlayzDev)")
            .setTimestamp()
    ]})
})