import { Client, Collection } from "discord.js";
import { config } from "dotenv";
import { Player } from "discord-player";
import { HolodexApiClient } from "holodex.js";
import { lyricsExtractor } from "@discord-player/extractor";
import { PrismaClient } from "@prisma/client";

import * as Commands from "../commands";
import * as Events from "../events";

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
    public override async login() {
        console.log("Loading discord-player default extractors");
        this.DiscordPlayer.extractors.loadDefault();

        console.log("Registering commands");
        this.Commands.clear();
        for (const [Name, { Command }] of Object.entries(Commands)) {
            console.log("Registering command -> ", Name, Command);
            this.Commands.set(Name, Command);
        }

        console.log("Registering events");
        for (const [Name, { Event }] of Object.entries(Events)) {
            console.log("Registering event ->", Name, Event);
            if (Event.Once) {
                // @ts-ignore
                this.once(Name, (...args) => Event.Callback(this, ...args));
            } else {
                // @ts-ignore
                this.on(Name, (...args) => Event.Callback(this, ...args));
            }
        }

        // Shard logging
        super.on("shardDisconnect", (event, id) => console.log(`Disconnected from shard ${id} (${event.code}), reconnecting.`));
        super.on("shardError", (err, id) => console.log(`Shard ${id} websocket error occured:\n${err}`));
        super.on("shardResume", (id, re) => console.log(`Shard ${id} reconnected successfully. (ReplayEvents ${re})`));
        super.on("shardReconnecting", (id) => console.log(`Attempting to reconnect to shard ${id}.`))

        console.log("Logging into Discord");
        return super.login(this.Config.DiscordToken);
    }
}
