import process from "node:process";
import MeteoriumClient from "../classes/client.js";
import { IntentsBitField } from "discord.js";
import { GuildFeatures } from "@prisma/client";

const client = new MeteoriumClient({
    intents: [IntentsBitField.Flags.Guilds],
});
const egfNS = client.logging.registerNamespace("InstallUtils").registerNamespace("EnableGuildFeature");
await client.login();

const guildId = process.env.METEORIUM_EGF_GUILDID;
const feature = GuildFeatures[process.env.METEORIUM_EGF_FEATURENAME as "Moderation"];
if (guildId && feature) await client.guildFeatures.enableFeature(guildId, feature);
else egfNS.error(`Configuration is incorrect, detected:\nGuild id: ${guildId}\nFeature: ${feature}`);

await client.destroy();

egfNS.info("Done");
process.exit(0);
