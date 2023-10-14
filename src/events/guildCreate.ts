import type { MeteoriumEvent } from ".";

export const Event: MeteoriumEvent<"guildCreate"> = {
    async Callback(client, guild) {
        const guildCreateNS = client.Logging.GetNamespace("Events/guildCreate");
        if (
            client.Database.guild.findUnique({
                where: { GuildId: guild.id },
            }) === null
        ) {
            guildCreateNS.verbose(`Creating new guild in database for ${guild.id}`);
            client.Database.guild.create({ data: { GuildId: guild.id } });
        }
        return;
    },
};
