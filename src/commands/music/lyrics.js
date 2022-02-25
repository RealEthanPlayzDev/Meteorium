const MeteoriumCommand = require("../../util/Command");
const Axios = require("axios");
const { SlashCommandBuilder } = require("@discordjs/builders");
const MeteoriumEmbed = require("../../util/MeteoriumEmbed");

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

module.exports = new MeteoriumCommand("lyrics", "Attempt to search for a song lyrics for the current song or a specific song", async (interaction, client) => {
    const queue = client.Player.getQueue(interaction.guildId), specificsongtitle = interaction.options.getString("songtitle");
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
}, new SlashCommandBuilder()
    .setName("lyrics")
    .setDescription("Attempt to search for a song lyrics for the current song or a specific song")
    .addStringOption(option => option.setName("songtitle").setDescription("Title for a specific song to search for it's lyrics").setRequired(false)))