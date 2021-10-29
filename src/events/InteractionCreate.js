module.exports = {
    name: "interactionCreate",
    once: false,
    async execute(_,__, interaction) { interaction.client.CommandHandler.HandleCommandInteraction(interaction) }
}