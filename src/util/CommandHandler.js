// The command handler for Meteorium
// Written by RadiatedExodus (ItzEthanPlayz_YT/RealEthanPlayzDev)

// TODO - Probably make a seperate Command class? Well for now I'm sticking with normal dictionaries

const fs = require("fs");
const path = require("path");
const { Collection } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

class MeteoriumCommandHandler {
    constructor(client, prefix, applicationId, token) {
        this.client = client;
        this.prefix = prefix;
        this.applicationId = applicationId;
        this.REST = new REST({ version: '9' }).setToken(token);
        this.parsedCommands = new Collection();
        this.interactionDeployCommands = [];
    }

    ParseCommands(targetDir = "../commands") {
        const files = fs.readdirSync(path.join(__dirname, targetDir)); //.filter(file => file.endsWith('.js'));
        for (const file of files) {
            const fInfo = fs.lstatSync(path.join(__dirname, targetDir, file));
            if (fInfo.isDirectory()) {
                this.ParseCommands(path.join(__dirname, targetDir, file));
            } else {
                try {
                    const command = require(path.join(__dirname, targetDir, file));
                    this.parsedCommands.set(command.name, command);
                    this.interactionDeployCommands.push(command.interactionData.toJSON());
                } catch(err) {
                    console.warn(`MeteoriumCommandHandler: error occured while parsing command file: ${path.join(__dirname, targetDir, file)}\n${err}`);
                }
            }
        }
    }

    DeployCommandInteraction(GuildId) {
        (async() => {
            try {
                console.log(`MeteoriumCommandHandler: Deploying interaction for guildId ${GuildId}`);
                await this.REST.put(Routes.applicationGuildCommands(this.applicationId, GuildId), { body: this.interactionDeployCommands });
                console.log(`MeteoriumCommandHandler: Interaction deployed for guildId ${GuildId}`);
            } catch (err) {
                console.error(`MeteoriumCommandHandler: Error occured when deploying command interaction, \n${err}`);
            }
        })();
    }

    async HandleCommandInteraction(interaction) {
        if (!interaction.isCommand()) return;
        const targetCommand = this.parsedCommands.get(interaction.commandName);
        if (!targetCommand) return;

        try {
            await targetCommand.execute(interaction, this.client);
        } catch(err) {
            await interaction.reply({ content: `An error occured when running the command:\n${String(err)}`, ephemeral: true })
        }
    }
}

module.exports = MeteoriumCommandHandler;