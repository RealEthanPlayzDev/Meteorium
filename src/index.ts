import { MeteoriumClient } from "./util/MeteoriumClient";
import { IntentsBitField } from "discord.js";

const Intents = new IntentsBitField()
Intents.add(
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildVoiceStates,
    IntentsBitField.Flags.GuildInvites,
    IntentsBitField.Flags.GuildEmojisAndStickers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.GuildMessageReactions,
    IntentsBitField.Flags.GuildPresences,
    IntentsBitField.Flags.GuildModeration
)

const Client = new MeteoriumClient({
    intents: Intents
});

Client.login();
