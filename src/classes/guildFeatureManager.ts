export { GuildFeatures } from "@prisma/client";
import { GuildFeatures } from "@prisma/client";
import MeteoriumClient from "./client.js";

export default class MeteoriumGuildFeatureManager {
    public client: MeteoriumClient;

    public constructor(client: MeteoriumClient) {
        this.client = client;
    }

    public async hasFeatureEnabled(guildId: string, feature: GuildFeatures) {
        const guildSettings = await this.client.db.guild.findUnique({ where: { GuildId: guildId } });
        if (!guildSettings) return false;
        return guildSettings.EnabledGuildFeatures.indexOf(feature) != -1;
    }

    public async enableFeature(guildId: string, feature: GuildFeatures) {
        if (await this.hasFeatureEnabled(guildId, feature)) return;
        await this.client.db.guild.update({
            where: { GuildId: guildId },
            data: {
                EnabledGuildFeatures: { push: [feature] },
            },
        });
        return;
    }

    public async disableFeature(guildId: string, feature: GuildFeatures) {
        const guildSettings = await this.client.db.guild.findUnique({ where: { GuildId: guildId } });
        if (!guildSettings) return false;
        await this.client.db.guild.update({
            where: { GuildId: guildId },
            data: {
                EnabledGuildFeatures: guildSettings.EnabledGuildFeatures.filter((v) => v != feature),
            },
        });
        return;
    }
}
