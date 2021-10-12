const MeteoriumCommand = require("../../util/Command");

module.exports = new MeteoriumCommand("errortest", "Command to test the MeteoriumCommandHandler's command interaction handler.", async (interaction, client) => {
    throw Error("This is an error test, designed to test the MeteoriumCommandHandler's command parser system");
});