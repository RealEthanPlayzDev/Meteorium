const GuildSettingSchema = require("../schemas/GuildSettingSchema")

module.exports = {
    name: "guildCreate",
    once: false,
    async execute(_, CommandHandler, guild) {  
        if ( await GuildSettingSchema.findOne({ GuildId: String(guild.id) }) === null ) {
            const newGuildSettingSchema = CommandHandler.CreateNewGuildSettingSchema(guild.id);
            await CommandHandler.SaveGuildSettingSchema(newGuildSettingSchema);
            CommandHandler.UpdateDisabledCommandCache(guild.id);
        }
    }
}