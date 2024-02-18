import { Client, ClientOptions } from "discord.js";
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { HolodexApiClient } from "holodex.js";

import Logging from "./logging.js";
import MeteoriumInteractionManager from "../interactions/index.js";
import MeteoriumEventManager from "../events/index.js";
import MeteoriumDatabaseUtilities from "./dbUtils.js";

function parseDotEnvConfig() {
    if (!process.env.METEORIUM_BOT_TOKEN) config();
    return {
        BotToken: String(process.env.METEORIUM_BOT_TOKEN),
        ApplicationId: String(process.env.METEORIUM_APPLICATION_ID),
        HolodexApiKey: String(process.env.METEORIUM_HOLODEX_APIKEY),
        GeniusApiKey: String(process.env.METEORIUM_GENIUS_APIKEY),
        ApplicationDeployGuildIds: String(process.env.METEORIUM_APPDEPLOY_GUILDIDS).split(","),
        RuntimeLogChannelIds: String(process.env.METEORIUM_RUNTIMELOG_CHANNELIDS).split(","),
        DontRegisterTestInteractions: Boolean(process.env.METEORIUM_NOREG_TESTINTERACTIONS),
    };
}

export default class MeteoriumClient extends Client<true> {
    public logging = new Logging("Meteorium");
    public config = parseDotEnvConfig();
    public db = new PrismaClient();
    public dbUtils = new MeteoriumDatabaseUtilities(this);
    public interactions = new MeteoriumInteractionManager(this);
    public events = new MeteoriumEventManager(this);
    public holodex = new HolodexApiClient({ apiKey: this.config.HolodexApiKey });

    public constructor(options: ClientOptions) {
        super(options);

        // Register all events and hook them
        this.events.register();

        // Register all interactions
        this.interactions.registerAllInteractions();

        return this;
    }

    public async login() {
        const loginNS = this.logging.getNamespace("Login");

        // Hook events
        this.events.hook();

        // Login
        loginNS.info("Logging in to Discord");
        return super.login(this.config.BotToken);
    }

    public async destroy() {
        await super.destroy();
        await this.db.$disconnect();
        return;
    }
}
