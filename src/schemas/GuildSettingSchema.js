const mongoose = require("mongoose");
module.exports = mongoose.model("GuildSetting", new mongoose.Schema({
    GuildId: String,
    EnforceSayinExecutor: Boolean,
    DisabledCommands: Array,
    DisabledCommandCategories: Array,
    MuteRoleId: String
}));