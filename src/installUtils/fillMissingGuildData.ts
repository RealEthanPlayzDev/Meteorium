import process from "node:process";
import MeteoriumClient from "../classes/client.js";
import { IntentsBitField } from "discord.js";

const client = new MeteoriumClient({
    intents: [IntentsBitField.Flags.Guilds],
});
const missingGDNS = client.logging.registerNamespace("InstallUtils").registerNamespace("FillMissingGuildData");
await client.login();

const guilds = await client.guilds.fetch({ limit: 200 });
let totalCount = 0; // wheres my ``Array.count``??
const data: Array<{ GuildId: string }> = guilds.map((guild) => {
    totalCount += 1;
    return { GuildId: guild.id };
});

missingGDNS.info(`Inserting the following guild ids to the Guild table: (${totalCount})`);

const result = await client.db.guild.createMany({
    data: data,
    skipDuplicates: true,
});

missingGDNS.info(`Finished, inserted rows: ${result.count}`);

await client.destroy();

missingGDNS.info("Done");
process.exit(0);
