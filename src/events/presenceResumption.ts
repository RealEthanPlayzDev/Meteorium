import type { MeteoriumEvent } from "./eventsEntry.js";

export const Event: MeteoriumEvent<"shardResume"> = {
    event: "shardResume",
    async callback(client) {},
    once: false,
};
