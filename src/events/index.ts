import { Collection } from "discord.js";
import type MeteoriumClient from "../classes/client.js";
import type { LoggingNamespace } from "../classes/logging.js";

import * as events from "./eventsEntry.js";

export default class MeteoriumEventManager {
    public events: Collection<string, events.MeteoriumEvent<any>>;
    public client: MeteoriumClient;
    public logging: LoggingNamespace;
    public eventNS: LoggingNamespace;

    public constructor(client: MeteoriumClient) {
        this.events = new Collection();
        this.client = client;
        this.logging = client.logging.registerNamespace("EventManager");
        this.eventNS = this.logging.registerNamespace("Event");
    }

    public register() {
        const regNS = this.logging.getNamespace("Registration");

        regNS.info("Registering events");
        for (const [Name, { Event }] of Object.entries(events)) {
            regNS.verbose(`Registering -> ${Name}${Event.once ? " (Once)" : ""}`);
            this.events.set(Name, Event);
        }

        return;
    }

    public hook() {
        const hookNS = this.logging.registerNamespace("Hooking");

        hookNS.info("Hooking events to client");
        for (const [Name, Event] of this.events) {
            hookNS.verbose(`Hooking -> ${Name}`);
            if (Event.once) this.client.once(Event.event, (...args) => Event.callback(this.client, ...args));
            else this.client.on(Event.event, (...args) => Event.callback(this.client, ...args));
        }

        return;
    }
}
