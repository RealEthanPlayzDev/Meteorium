const MeteoriumCommand = require("../../util/Command");

module.exports = new MeteoriumCommand("ping", "Returns latency number", async (interaction, client) => {
    const msg = await interaction.deferReply();
    interaction.editReply(`Message ping: ${Date.now() - msg.createdTimestamp}\nWebsocket ping: ${client.ws.ping}`);
});