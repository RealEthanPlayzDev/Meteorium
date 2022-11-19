import type { Awaitable, ClientEvents } from 'discord.js';
import type { MeteoriumClient } from "../util/MeteoriumClient";

export * as ready from "./ready";
export * as interactionCreate from "./interactionCreate";

export type MeteoriumEvent<EventName extends keyof ClientEvents> = {
    Callback(client: MeteoriumClient, ...args: ClientEvents[EventName]): Awaitable<any>;
    Once?: true;
}