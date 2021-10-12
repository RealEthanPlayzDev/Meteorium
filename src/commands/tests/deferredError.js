const MeteoriumCommand = require("../../util/Command");

module.exports = new MeteoriumCommand("deferrederrortest", "Command to test the MeteoriumCommandHandler's command interaction handler. (deferredReply)", async (interaction, client) => {
    await interaction.deferReply();
    throw Error("This is an error test, designed to test the MeteoriumCommandHandler's command parser system");
});