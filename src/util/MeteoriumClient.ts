import { Client, Collection } from "discord.js";
import { config } from "dotenv";
import { Player } from "discord-player";
import { HolodexApiClient } from 'holodex.js';
import * as Commands from '../commands';
import * as Events from "../events";
import { MeteoriumDatabase } from "./MeteoriumDatabase";

const ParseDotEnvConfig = () => {
    if (!process.env.METEORIUMBOTTOKEN) { config({"path": "./.ENV"}); }
    const InteractionFirstDeployGuildIds = String(process.env.DEPLOYGUILDIDS).split(",");
    return {
        "MongoDB_URI": String(process.env.METEORIUMMONGODBURI),
        "DiscordToken": String(process.env.METEORIUMBOTTOKEN),
        "DiscordApplicationId": String(process.env.METEORIUMAPPLICATIONID),
        "InteractionFirstDeployGuildIds": InteractionFirstDeployGuildIds,
        "HolodexAPIKey": String(process.env.METEORIUMHOLODEXTOKEN),
        "RatelimitMaxLimit": Number(process.env.RATELIMITMAXLIMIT),
        "RatelimitMaxLimitTime": Number(process.env.RATELIMITMAXLIMITTIME)
    }
}

export class MeteoriumClient extends Client<true> {
    public Config = ParseDotEnvConfig();
    public Commands = new Collection<string, Commands.MeteoriumCommand>;
    public Database = new MeteoriumDatabase(this.Config.MongoDB_URI);
    public Player = new Player(this);
    public HolodexClient = new HolodexApiClient({ apiKey: this.Config.HolodexAPIKey });
    public override async login() {
        console.log("Connecting to Mongo database");
        await Promise.all([ this.Database.connect() ]);

        console.log("Registering commands");
        this.Commands.clear();
        for(const [Name, { Command }] of Object.entries(Commands)) {
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

        console.log("Logging into Discord");
        return super.login(this.Config.DiscordToken);
    };
}