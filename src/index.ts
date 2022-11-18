import { MeteoriumClient } from "./util/MeteoriumClient";

const Client = new MeteoriumClient({
    intents: ["Guilds", "GuildIntegrations", "GuildVoiceStates"]
});

await Client.login();