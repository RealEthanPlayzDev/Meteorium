import type { MeteoriumEvent } from "./eventsEntry.js";

export const Event: MeteoriumEvent<"ready"> = {
    event: "ready",
    async callback(client) {},
    once: true,
};
