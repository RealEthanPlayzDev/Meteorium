const { Message } = require("discord.js");
const MeteoriumCommand = require("../../util/Command");

module.exports = new MeteoriumCommand("ping", "Returns latency number", async (interaction, client) => {
    const msg = await interaction.deferReply();
    interaction.editReply(`Websocket ping: ${client.ws.ping} ms`); // Message ping: ${Date.now() - msg instanceof Message && msg.createdTimestamp || msg.timestamp}\n
});