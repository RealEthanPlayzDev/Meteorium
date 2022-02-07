import { MeteoriumClient } from "./util/MeteoriumClient";
import { Intents } from "discord.js";
const client = new MeteoriumClient({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_INTEGRATIONS, Intents.FLAGS.GUILD_VOICE_STATES] });
client.login();