import process from "node:process";
import MeteoriumClient from "../classes/client.js";
import { IntentsBitField } from "discord.js";

const client = new MeteoriumClient({
    intents: [IntentsBitField.Flags.Guilds],
});
const ciNS = client.logging.registerNamespace("InstallUtils").registerNamespace("ClearInteractions");
await client.login();

ciNS.warn("All interaction data will be cleared in 10 seconds!");
await new Promise((resolve) => setTimeout(resolve, 10000));
ciNS.info("Clearing global interaction data");
await client.application.commands.set([]);
client.config.ApplicationDeployGuildIds.forEach(async (guildId) => {
    const guild = await client.guilds.fetch(guildId).catch(() => null);
    if (!guild) return ciNS.error(`Cannot get guild ${guildId} for clearing interactions`);
    ciNS.verbose(`Clearing interactions -> ${guildId}`);
    await guild.commands.set([]);
});

await client.destroy();

ciNS.info("Done");
process.exit(0);
