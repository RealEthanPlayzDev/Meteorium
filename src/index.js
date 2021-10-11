const { Client, Intents } = require("discord.js");
const { token, prefix, applicationId, targetGuildIds } = require("../config.json");
const MeteoriumCommandHandler = require("./util/CommandHandler");
const MeteoriumEventHandler = require("./util/EventHandler");

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
const CommandHandler = new MeteoriumCommandHandler(client, prefix, applicationId, token);
const EventHandler = new MeteoriumEventHandler(client);

EventHandler.RegisterEvents();
CommandHandler.ParseCommands();

for (const GuildId of targetGuildIds) {
    CommandHandler.DeployCommandInteraction(GuildId);
}

client.on("interactionCreate", async interaction => {
    CommandHandler.HandleCommandInteraction(interaction);
});

client.login(token);