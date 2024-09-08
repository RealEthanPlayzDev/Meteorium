import MeteoriumClient from "./classes/client.js";
import { IntentsBitField } from "discord.js";

const client = new MeteoriumClient({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildModeration,
        IntentsBitField.Flags.GuildVoiceStates,
        IntentsBitField.Flags.GuildPresences,
    ],
});

await client.login();
