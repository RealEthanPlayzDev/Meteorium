import type { MeteoriumEvent } from "./eventsEntry.js";

export const Event: MeteoriumEvent<"interactionCreate"> = {
    event: "interactionCreate",
    async callback(client, interaction) {
        await client.interactions.dispatchInteraction(interaction);
        return;
    },
    once: false,
};
