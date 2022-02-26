const MeteoriumClient = require("./util/MeteoriumClient");
const { Intents } = require("discord.js");
const client = new MeteoriumClient({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_INTEGRATIONS, Intents.FLAGS.GUILD_VOICE_STATES] });
client.login(false);