// Extended version of the discordjs client object with MeteoriumCommandHandler, MeteoriumEventHandler, and the configuration built in
// Written by RadiatedExodus (ItzEthanPlayz_YT/RealEthanPlayzDev)

// Load .ENV
const dotenv = require("dotenv");
const { Client } = require("discord.js");
const MeteoriumCommandHandler = require("../util/CommandHandler");
const MeteoriumEventHandler = require("../util/EventHandler");
const mongoose = require("mongoose");
const { Player } = require("discord-player");

const ParseDotEnvConfig = () => {
    if (!process.env.METEORIUMBOTTOKEN) { dotenv.config({"path": "./.ENV"}); }
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

class MeteoriumClient extends Client {
    constructor(options) {super(options)} // Setting up the client is at the login
    async login() {
        this.config = ParseDotEnvConfig();
        this.CommandHandler = new MeteoriumCommandHandler(this, this.config.prefix, this.config.applicationId, this.config.token);
        this.EventHandler = new MeteoriumEventHandler(this);
        this.Player = new Player(this);

        // Connect to MongoDB server using mongoose
        mongoose.connect(this.config.mongodb_urlstring, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }).then(() => {
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

module.exports = MeteoriumClient;