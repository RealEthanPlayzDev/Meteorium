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

        // Login
        return super.login(this.config.token);
    }
}

module.exports = MeteoriumClient;