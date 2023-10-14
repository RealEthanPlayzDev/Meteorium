import { ActivityType } from "discord.js";
import type { MeteoriumEvent } from ".";

export const Event: MeteoriumEvent<"shardResume"> = {
    async Callback(client) {
        client.user.setPresence({
            status: "idle",
            activities: [{ name: "no", type: ActivityType.Playing }],
        });
        return;
    },
};
