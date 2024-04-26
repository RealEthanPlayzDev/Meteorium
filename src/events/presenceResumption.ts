import { ActivityType } from "discord.js";
import type { MeteoriumEvent } from "./eventsEntry.js";

export const Event: MeteoriumEvent<"shardResume"> = {
    event: "shardResume",
    async callback(client) {
        const resumeNS = client.events.eventNS.getNamespace("PresenceResumption");
        resumeNS.info("Setting client presence");
        client.user.setPresence({
            status: "idle",
            activities: [{ name: "no", type: ActivityType.Playing }],
        });
        return;
    },
    once: false,
};
