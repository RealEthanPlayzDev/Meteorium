import { Client, Collection } from "discord.js";
import { config } from "dotenv";
import * as Commands from '../commands';
import * as Events from "../events";

const ParseDotEnvConfig = () => {
    if (!process.env.METEORIUMBOTTOKEN) { config({"path": "./.ENV"}); }
    const tgid = String(process.env.DEPLOYGUILDIDS).split(",")
    return {
        "MongoDB_URI": String(process.env.METEORIUMMONGODBURI),
        "DiscordToken": String(process.env.METEORIUMBOTTOKEN),
        "DiscordApplicationId": String(process.env.METEORIUMAPPLICATIONID),
        "InteractionFirstDeployGuildIds": tgid,
        "HolodexAPIKey": String(process.env.METEORIUMHOLODEXTOKEN),
        "RatelimitMaxLimit": Number(process.env.RATELIMITMAXLIMIT),
        "RatelimitMaxLimitTime": Number(process.env.RATELIMITMAXLIMITTIME)
    }
}

export class MeteoriumClient extends Client<true> {
    public Config = ParseDotEnvConfig();
    public Commands = new Collection<string, Commands.MeteoriumCommand>;
    public override async login() {
        console.log("Registering commands");
        for(const [Name, { Command }] of Object.entries(Commands)) {
            console.log("Registering command -> " + Name);
            this.Commands.set(Name, Command);
        }

        console.log("Registering events");
        for (const [Name, { Event }] of Object.entries(Events)) {
            if (Event.Once) {
              this.once(Name, (...args) => Event.Callback(this, ...args));
            } else {
              this.on(Name, (...args) => Event.Callback(this, ...args));
            }
          }

        console.log("Logging into Discord");
        return super.login(this.Config.DiscordToken);
    };
}