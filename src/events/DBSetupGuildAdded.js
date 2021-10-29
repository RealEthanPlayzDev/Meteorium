const GuildSettingSchema = require("../schemas/GuildSettingSchema")

module.exports = {
    name: "guildCreate",
    once: false,
    async execute(guild) {  
        //if ( await GuildSettingSchema.findOne({ GuildId: String(guild.id) }) === null ) {
            const newGuildSettingSchema = new GuildSettingSchema({
                GuildId: guild.id,
                EnforceSayinExecutor: false,
                DisabledCommands: {},
                DisabledCommandCategories: {},
                MuteRoleId: ""
            });
            function save() { newGuildSettingSchema.save().then(() => { console.log("Successfully registered schema for guild "+guild.id) }).catch(() => { save() }) }
            save();
        //}
    }
}