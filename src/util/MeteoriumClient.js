// Extended version of the discordjs client object with MeteoriumCommandHandler, MeteoriumEventHandler, and the configuration built in
// Written by RadiatedExodus (ItzEthanPlayz_YT/RealEthanPlayzDev)

const { Client } = require("discord.js");
const MeteoriumCommandHandler = require("../util/CommandHandler");
const MeteoriumEventHandler = require("../util/EventHandler");
const mongoose = require("mongoose");

class MeteoriumClient extends Client {
    constructor(options) {super(options)} // Setting up the client is at the login
    async login() {
        this.config = require("../../config.json");
        this.CommandHandler = new MeteoriumCommandHandler(this, this.config.prefix, this.config.applicationId, this.config.token);
        this.EventHandler = new MeteoriumEventHandler(this);

        // Connect to MongoDB server using mongoose
        mongoose.connect("mongodb://127.0.0.1:27017/meteoriumdb", {
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
        super.on("shardReconnecting", (id) => console.warn(`MeteoriumClient: Shard reconnecting (id: ${id})`));
        super.on("shardDisconnect", (closeEvent, shardNumber) => console.error(`MeteoriumClient: Shard disconnected ans will not longer reconnect\nnumber: ${shardNumber}\ncode: ${closeEvent.code}\nreason: ${closeEvent.reason})`));
        super.on("shardResume", (id) => console.log(`MeteoriumClient: Shard reconnected successfully (id: ${id})`));
        super.on("shardError", (err, id) => console.error(`MeteoriumClient: Shard websocket error occured (id: ${id})\n${err.stack}`));

        // Login
        return super.login(this.config.token);
    }
}

module.exports = MeteoriumClient;