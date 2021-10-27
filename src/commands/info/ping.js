const { Message } = require("discord.js");
const MeteoriumCommand = require("../../util/Command");

module.exports = new MeteoriumCommand("ping", "Returns latency number", async (interaction, client) => {
    const msg = await interaction.deferReply({ fetchReply: true });
    interaction.editReply(`Websocket ping: ${client.ws.ping} ms\nRoundtrip ping: ${msg.createdTimestamp - interaction.createdTimestamp} ms\nRoundtrip ping (local time method): ${msg.createdTimestamp - Date.now()} ms`);
});