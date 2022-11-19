import { MeteoriumClient } from "./util/MeteoriumClient";
import { GatewayIntentBits } from 'discord.js';

const Client = new MeteoriumClient({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

await Client.login();