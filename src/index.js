const MeteoriumClient = require("./util/MeteoriumClient");
const { Intents } = require("discord.js");
const client = new MeteoriumClient({ intents: [Intents.FLAGS.GUILDS] });
client.login();