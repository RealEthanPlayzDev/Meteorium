import { SlashCommandBuilder } from "discord.js";
import { GuildFeatures } from "@prisma/client";
import type { MeteoriumChatCommand } from "../../index.js";

export const Command: MeteoriumChatCommand = {
    interactionData: new SlashCommandBuilder()
        .setName("modping")
        .setDescription("Initiates a mod ping to call available moderators")
        .setDMPermission(false),
    requiredFeature: GuildFeatures.Moderation,
    async callback(interaction, client) {
        return await client.dbUtils.processModPing(interaction.guildId, interaction.user.id, interaction);
    },
    initialize(client) {
        setInterval(async () => {
            client.dbUtils.modPingData.forEach(async (_, i) => {
                const [reqId, guildId] = i.split("-");
                await client.dbUtils.processModPing(guildId, reqId);
            });
        }, 120000);
    },
};
