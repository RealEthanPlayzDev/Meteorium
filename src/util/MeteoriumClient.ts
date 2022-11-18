import { Client } from "discord.js";
import { config } from "dotenv";

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
    Config = ParseDotEnvConfig();
    public override async login() {
        console.log("Logging into Discord");
        return super.login(this.Config.DiscordToken);
    }
}