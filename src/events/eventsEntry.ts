import type { Awaitable, ClientEvents } from "discord.js";
import type MeteoriumClient from "../classes/client.js";

export * as ReadyInit from "./readyInit.js";
export * as InteractionHandler from "./interactionHandler.js";
export * as PresenceResumption from "./presenceResumption.js";
export * as GuildDataSetup from "./guildDataSetup.js";
export * as GuildMemberJoinLogging from "./guildMemberJoinLogging.js";
export * as GuildMemberLeaveLogging from "./guildMemberLeaveLogging.js";

export type MeteoriumEvent<EventName extends keyof ClientEvents> = {
    event: EventName;
    callback(client: MeteoriumClient, ...args: ClientEvents[EventName]): Awaitable<any>;
    once: boolean;
};
