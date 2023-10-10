import type { MeteoriumEvent } from ".";

export const Event: MeteoriumEvent<"guildCreate"> = {
    async Callback(client, guild) {
        if (client.Database.guild.findUnique({ where: { GuildId: guild.id } }) === null) {
            console.log(`Creating new guild in database for ${guild.id}`);
            client.Database.guild.create({ data: { GuildId: guild.id } });
        }
        return;
    }
}