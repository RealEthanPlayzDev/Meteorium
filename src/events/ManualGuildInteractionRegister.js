const GuildSettingSchema = require("../schemas/GuildSettingSchema")

module.exports = {
    name: "ready",
    once: true,
    async execute(client) {
        // Manual guild interaction deployment
        for (const GuildId of client.config.targetGuildIds) {
            client.CommandHandler.DeployCommandInteraction(GuildId);
        }
    }
}