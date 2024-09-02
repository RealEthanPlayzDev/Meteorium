import { Interaction } from "discord.js";
import type { MeteoriumEvent } from "./eventsEntry.js";

export const Event: MeteoriumEvent<"interactionCreate"> = {
    event: "interactionCreate",
    async callback(client, interaction) {
        await client.interactions.dispatchInteraction(interaction);
        await client.dbUtils.processVerification(interaction as Interaction<"cached">, true);
        return;
    },
    once: false,
};
