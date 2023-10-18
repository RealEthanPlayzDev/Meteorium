import type { Awaitable, ClientEvents } from "discord.js";
import type { MeteoriumClient } from "../util/MeteoriumClient";

export * as ready from "./ready";
export * as interactionCreate from "./interactionCreate";
export * as guildCreate from "./guildCreate";
export * as shardResume from "./shardResume";
export * as guildMemberAdd from "./guildMemberAdd";
export * as guildMemberRemove from "./guildMemberRemove";

export type MeteoriumEvent<EventName extends keyof ClientEvents> = {
    Callback(client: MeteoriumClient, ...args: ClientEvents[EventName]): Awaitable<any>;
    Once?: true;
};
