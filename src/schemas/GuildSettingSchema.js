const mongoose = require("mongoose");
module.exports = mongoose.model("GuildSetting", new mongoose.Schema({
    GuildId: String,
    EnforceSayinExecutor: Boolean,
    DisabledCommands: Object,
    DisabledCommandCategories: Object,
    MuteRoleId: String
}));