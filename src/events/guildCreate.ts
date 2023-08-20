import type { MeteoriumEvent } from ".";

export const Event: MeteoriumEvent<"guildCreate"> = {
    async Callback(client, guild) {
        if (client.Database.Guilds.findOne({ GuildId: guild.id }) === null) {
            console.log(`Creating new GuildSetting for ${guild.id}`);
            client.Database.Guilds.insertOne(client.Database.CreateGuildSetting(guild.id));
        }
        return;
    }
}