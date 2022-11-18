import type { MeteoriumEvent } from ".";
import { ActivityType } from "discord.js";

export const Event: MeteoriumEvent<"ready"> = {
    async Callback(client) {
        console.log("Registering slash commands");
        await client.application.commands.set(client.Commands.map((Command) => Command.InteractionData.toJSON()));

        console.log("Setting user presence")
        client.user.setPresence({
            status: "idle",
            activities: [{ name: "no", type: ActivityType.Playing }]
        });

        console.log("Bot ready");
        return;
    }
}