// The event handler for Meteorium
// Written by RadiatedExodus (ItzEthanPlayz_YT/RealEthanPlayzDev)

const fs = require("fs");
const path = require("path");

class MeteoriumEventHandler {
    constructor(client) {
        this.client = client;
    }

    RegisterEvents(targetDir = "../events") {
        const files = fs.readdirSync(path.join(__dirname, targetDir));
        for (const file of files) {
            const fInfo = fs.lstatSync(path.join(__dirname, targetDir, file));
            if (fInfo.isDirectory()) {
                this.RegisterEvents(path.join(__dirname, targetDir, file));
            } else {
                try {
                    const event = require(path.join(__dirname, targetDir, file));
                    if (event.once) {
                        this.client.once(event.name, (...args) => {
                            event.execute(this.client, this.client.CommandHandler, ...args);
                        });
                    } else {
                        this.client.on(event.name, (...args) => {
                            event.execute(this.client, this.client.CommandHandler, ...args);
                        });
                    }
                } catch(err) {
                    console.warn(`MeteoriumEventHandler: An error occured when attempting to parse event file: ${file}\n${err.stack}`);
                }
            }
        }
    }
}

module.exports = MeteoriumEventHandler
