// Extended version of the discordjs client object with MeteoriumCommandHandler, MeteoriumEventHandler, and the configuration built in
// Written by RadiatedExodus (ItzEthanPlayz_YT/RealEthanPlayzDev)

// Load .ENV
import process from "node:process"
import { config as configenvironment } from "dotenv";
import { Client } from 'discord.js';
const MeteoriumCommandHandler = require("../util/CommandHandler");
const MeteoriumEventHandler = require("../util/EventHandler");
import mongoose from "mongoose";
import { Player } from "discord-player";

const ParseDotEnvConfig = () => {
    if (!process.env.METEORIUMBOTTOKEN) { configenvironment({"path": "./.ENV"}); }
    const tgid = String(process.env.DEPLOYGUILDIDS).split(",")
    return {
        "mongodb_urlstring": String(process.env.METEORIUMMONGODBURI),
        "token": String(process.env.METEORIUMBOTTOKEN),
        "applicationId": String(process.env.METEORIUMAPPLICATIONID),
        "targetGuildIds": tgid,
        "holodexApiKey": String(process.env.METEORIUMHOLODEXTOKEN),
        "ratelimitMaxLimit": Number(process.env.RATELIMITMAXLIMIT),
        "ratelimitMaxLimitTime": Number(process.env.RATELIMITMAXLIMITTIME)
    }
}

export class MeteoriumClient extends Client<true> {
    public config = ParseDotEnvConfig(); // {mongodb_urlstring: "", token: "", applicationId: "", targetGuildIds: "", holodexApiKey: "", ratelimitMaxLimit: "", ratelimitMaxLimitTime: ""};
    public CommandHandler = new MeteoriumCommandHandler(this, "", this.config.applicationId, this.config.token);
    public EventHandler = new MeteoriumEventHandler(this);
    public Player = new Player(this);

    async login() {
        // Connect to MongoDB server using mongoose
        mongoose.connect(this.config.mongodb_urlstring).then(() => {
            console.log("MeteoriumClient: Successfully connected to MongoDB database");
        }).catch((err) => {
            throw err;
        });

        // Meteorium core component initializations
        this.EventHandler.RegisterEvents();
        this.CommandHandler.ParseCommands();

        // Websocket disconnect/reconnects
        var DisconnectAmount = 0, LastDisconnect = process.uptime();
        super.on("shardReconnecting", (id) => {
            if (DisconnectAmount >= this.config.ratelimitMaxLimit) {
                if ((process.uptime() - LastDisconnect) >= this.config.ratelimitMaxLimitTime) {
                    console.error(`Disconnected more than ${this.config.ratelimitMaxLimit} times in ${this.config.ratelimitMaxLimitTime} seconds! Exiting with code 1`);
                    process.exit(1);
                } else {
                    DisconnectAmount = 0
                }
            }
            DisconnectAmount += 1
            LastDisconnect = process.uptime()
            console.warn(`MeteoriumClient: Shard reconnecting (id: ${id})`)
        });
        super.on("shardDisconnect", (closeEvent, shardNumber) => console.error(`MeteoriumClient: Shard disconnected and will not longer reconnect\nnumber: ${shardNumber}\ncode: ${closeEvent.code}\nreason: ${closeEvent.reason})`));
        super.on("shardResume", (id) => console.log(`MeteoriumClient: Shard reconnected successfully (id: ${id})`));
        super.on("shardError", (err, id) => console.error(`MeteoriumClient: Shard websocket error occured (id: ${id})\n${err.stack}`));

        // Login
        return super.login(this.config.token);
    }
}