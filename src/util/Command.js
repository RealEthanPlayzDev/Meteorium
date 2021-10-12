// The command class for Meteorium, used by all commands as the base class
// It's pretty simple at the moment, just some small fields and that's all
// Written by RadiatedExodus (ItzEthanPlayz_YT/RealEthanPlayzDev)

const { SlashCommandBuilder } = require("@discordjs/builders");

class MeteoriumCommand {
    constructor(name, description, execute = async () => {}, interactionData = undefined) {
        if (!name || !description) { throw new Error("MeteoriumCommand: There is no name/description specified!") }
        this.name = name;
        this.description = description;
        this.execute = execute;
        this.interactionData = interactionData ?? new SlashCommandBuilder().setName(name).setDescription(description);
    }

    SetName(newName) {
        this.name = newName;
        if (this.interactionData) { this.interactionData.setName(newName) }
    }

    SetDescription(newDescription) {
        this.description = newDescription;
        if (this.interactionData) { this.interactionData.setDescription(newDescription) }
    }

    SetInteractionData(newInteraction) {
        this.interactionData = newInteraction;
    }

    SetExecute(newExecute) {
        this.execute = newExecute;
    }

    GetInteractionData() {
        return this.interactionData;
    }
}

module.exports = MeteoriumCommand;