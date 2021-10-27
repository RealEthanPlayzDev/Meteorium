const GuildSettingSchema = require("../schemas/GuildSettingSchema")

module.exports = {
    name: "ready",
    once: true,
    async execute(client) {
        // Global guild interaction deployment
        client.CommandHandler.DeployGlobalCommandInteraction();

        // Manual guild interaction deployment
        for (const GuildId of client.config.targetGuildIds) {
            client.CommandHandler.DeployCommandInteraction(GuildId);
        }
    }
}