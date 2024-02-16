import type { MeteoriumEvent } from "./eventsEntry.js";

export const Event: MeteoriumEvent<"guildCreate"> = {
    event: "guildCreate",
    async callback(client, guild) {
        await client.db.guild.upsert({
            where: { GuildId: guild.id },
            create: { GuildId: guild.id },
            update: {},
        });
        return;
    },
    once: false,
};
