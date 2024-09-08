import { Interaction } from "discord.js";
import type { MeteoriumEvent } from "./eventsEntry.js";

export const Event: MeteoriumEvent<"interactionCreate"> = {
    event: "interactionCreate",
    async callback(client, interaction) {
        await client.interactions.dispatchInteraction(interaction);
        await client.dbUtils.processVerification(interaction as Interaction<"cached">, true);
        if (!interaction.isChatInputCommand())
            await client.dbUtils.processModPing(
                interaction.guildId!,
                interaction.user.id,
                interaction as Interaction<"cached">,
            );
        return;
    },
    once: false,
};
