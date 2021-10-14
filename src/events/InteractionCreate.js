module.exports = {
    name: "interactionCreate",
    once: false,
    async execute(interaction) { interaction.client.CommandHandler.HandleCommandInteraction(interaction) }
}