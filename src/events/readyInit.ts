import { ActivityType } from "discord.js";
import type { MeteoriumEvent } from "./eventsEntry.js";

export const Event: MeteoriumEvent<"ready"> = {
    event: "ready",
    async callback(client) {
        const readyNS = client.events.eventNS.getNamespace("ReadyInit");
        const startTime = new Date();
        const interJson = client.interactions.generateAppsJsonData();

        // Register to global interactions registry
        readyNS.info("Registering to global interactions registry");
        await client.application.commands.set(interJson);

        // Register to guild interactions registry
        client.config.ApplicationDeployGuildIds.forEach(async (guildId) => {
            const guild = await client.guilds.fetch(guildId).catch(() => null);
            if (!guild) return readyNS.error(`Cannot get guild ${guildId} for registering guild interactions registry`);
            readyNS.info(`Registering guild interactions registry -> ${guildId}`);
            await guild.commands.set(interJson);
        });

        // Set user presence
        readyNS.info("Setting client presence");
        client.user.setPresence({
            status: "idle",
            activities: [{ name: "no", type: ActivityType.Playing }],
        });

        readyNS.info("Bot ready");
        return;
    },
    once: true,
};
