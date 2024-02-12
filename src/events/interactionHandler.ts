import type { MeteoriumEvent } from "./eventsEntry.js";

export const Event: MeteoriumEvent<"interactionCreate"> = {
    event: "interactionCreate",
    async callback(client, interaction) {},
    once: false,
};
