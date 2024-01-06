import { Client, Collection } from "discord.js";
import { config } from "dotenv";
import { Player } from "discord-player";
import { HolodexApiClient } from "holodex.js";
import { lyricsExtractor } from "@discord-player/extractor";
import { PrismaClient } from "@prisma/client";

import * as Commands from "../commands";
import * as Events from "../events";
import { MeteoriumLogging } from "./MeteoriumLogging";

const ParseDotEnvConfig = () => {
    if (!process.env.METEORIUMBOTTOKEN) {
        config({ path: "./.ENV" });
    }
    const InteractionFirstDeployGuildIds = String(process.env.DEPLOYGUILDIDS).split(",");
    return {
        MongoDB_URI: String(process.env.METEORIUMMONGODBURI),
        DiscordToken: String(process.env.METEORIUMBOTTOKEN),
        DiscordApplicationId: String(process.env.METEORIUMAPPLICATIONID),
        InteractionFirstDeployGuildIds: InteractionFirstDeployGuildIds,
        HolodexAPIKey: String(process.env.METEORIUMHOLODEXTOKEN),
        RatelimitMaxLimit: Number(process.env.RATELIMITMAXLIMIT),
        RatelimitMaxLimitTime: Number(process.env.RATELIMITMAXLIMITTIME),
        GeniusAPIKey: String(process.env.GENIUSAPIKEY),
    };
};

export class MeteoriumClient extends Client<true> {
    public Config = ParseDotEnvConfig();
    public Commands = new Collection<string, Commands.MeteoriumCommand>();
    public Database = new PrismaClient();
    public DiscordPlayer = new Player(this);
    public LyricsExtractor = lyricsExtractor(this.Config.GeniusAPIKey);
    public HolodexClient = new HolodexApiClient({
        apiKey: this.Config.HolodexAPIKey,
    });
    public Logging = new MeteoriumLogging("Meteorium");
    public override async login() {
        const loginNS = this.Logging.RegisterNamespace("init", true);

        loginNS.info("Loading discord-player default extractors");
        this.DiscordPlayer.extractors.loadDefault();

        loginNS.info("Registering commands");
        this.Commands.clear();
        for (const [Name, { Command }] of Object.entries(Commands)) {
            loginNS.debug(`Registering command -> ${Name} ${Command}`);
            if (Command.Init) {
                loginNS.debug(`Running command init -> ${Name} ${Command}`);
                await Command.Init(this);
            }
            this.Commands.set(Name, Command);
        }

        loginNS.info("Registering events");
        for (const [Name, { Event }] of Object.entries(Events)) {
            loginNS.debug(`Registering event -> ${Name} ${Event}`);
            if (Event.Once) {
                // @ts-ignore
                this.once(Name, (...args) => Event.Callback(this, ...args));
            } else {
                // @ts-ignore
                this.on(Name, (...args) => Event.Callback(this, ...args));
            }
        }

        // Shard logging
        const shardNS = this.Logging.RegisterNamespace("Sharding", true);
        super.on("shardDisconnect", (event, id) => shardNS.warn(`Disconnected from shard ${id} (code ${event.code}).`));
        super.on("shardError", (err, id) => shardNS.error(`Shard ${id} websocket error occured:\n${err}`));
        super.on("shardResume", (id, re) => shardNS.info(`Shard ${id} reconnected successfully. (ReplayEvents ${re})`));
        super.on("shardReconnecting", (id) => shardNS.info(`Attempting to reconnect to shard ${id}.`));

        loginNS.info("Logging into Discord");
        return super.login(this.Config.DiscordToken);
    }
}
