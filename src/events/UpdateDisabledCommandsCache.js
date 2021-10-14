module.exports = {
    name: "ready",
    once: true,
    async execute(client) {
        // Register and update local DisabledCommands cache
        for (const guild of client.guilds.cache) {
            if (guild[1].available) {
                client.CommandHandler.UpdateDisabledCommandCache(guild[1].id);
            }
        }
    }
}