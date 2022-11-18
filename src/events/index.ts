import type { Awaitable, ClientEvents } from 'discord.js';
import type { MeteoriumClient } from "../util/MeteoriumClient";

export * as BotReady from "./BotReady";

export type MeteoriumEvent<EventName extends keyof ClientEvents> = {
    Callback(client: MeteoriumClient, ...args: ClientEvents[EventName]): Awaitable<any>;
    Once?: true;
}