import { MeteoriumClient } from "./util/MeteoriumClient";

const Client = new MeteoriumClient({
    intents: ["Guilds", "GuildIntegrations", "GuildVoiceStates"]
});

await Client.login();

console.log("Login finished, setting presence");
Client.user.setPresence({
    status: "idle",
    activities: [{ name: "no" }]
});