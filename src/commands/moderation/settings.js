const { SlashCommandBuilder, SlashCommandSubcommandGroupBuilder } = require("@discordjs/builders");
const MeteoriumEmbed = require("../../util/MeteoriumEmbed");
const MeteoriumCommand = require("../../util/Command");
const GuildSettingSchema = require("../../schemas/GuildSettingSchema");

module.exports = new MeteoriumCommand("settings", "Command to change settings for this server", async (interaction, client) => {
    await interaction.deferReply();

    if (!interaction.member.permissions.has("ADMINISTRATOR", true)) {
        await interaction.editReply({ embeds: [
            new MeteoriumEmbed("Cannot change setting", "You do not have permission to use this command! (Missing permission ADMINISTRATOR)", "FF0000")
        ]});
        return
    }

    const subcommandgroup = interaction.options.getSubcommandGroup(), subcommand = interaction.options.getSubcommand();
    const guildSchema = await GuildSettingSchema.findOne({ GuildId: interaction.guildId });

    switch(subcommandgroup) {
        case "general" : {
            switch(subcommand) {
                case "enforcesayinexecutor": {
                    GuildSettingSchema.findOneAndUpdate({ GuildId: String(interaction.guildId) }, { EnforceSayinExecutor: interaction.options.getBoolean("enabled") }).then(async () => {
                        await interaction.editReply(`Successfully changed setting "EnforceSayinExecutor", new value: ${interaction.options.getBoolean("enabled")}`);
                    }).catch((err) => {
                        throw new Error(`An error occured when updated the settings database\n${err.stack}`);
                    });
                     return
                }
                case "setmuterole" : {
                    const role = interaction.options.getRole("role");
                    GuildSettingSchema.findOneAndUpdate({ GuildId: String(interaction.guildId) }, { MuteRoleId: String(role.id) }).then(async() => {
                        await interaction.editReply("Successfully set the mute role.");
                    }).catch((err) => {
                        throw new Error(`An error occured when updated the settings database\n${err.stack}`);
                    })
                    return
                }
            }
            return
        }
        case "disabledcommands" : {
            switch(subcommand) {
                case "add" : {
                    const targetCommands = ([]).concat(interaction.options.getString("commands").split(",")), updatedDisabledCommands = guildSchema.DisabledCommands;
                    var parseSuccess = true, failParseCommandName = "";

                    for (const targetCommand of targetCommands) {
                        if (client.CommandHandler.parsedCommands.get(targetCommand)) {
                            console.log(targetCommand)
                            updatedDisabledCommands[client.CommandHandler.parsedCommands.get(targetCommand).name] = client.CommandHandler.parsedCommands.get(targetCommand).description
                        } else {
                            failParseCommandName = targetCommand;
                            parseSuccess = false;
                            break;
                        }
                    }

                    if (!parseSuccess) {
                        await interaction.editReply({ embeds: [
                            new MeteoriumEmbed("Error", `Command name ${failParseCommandName} does not exist! (to prevent this error, type command names correctly, multiple commands seperated with command like "test,embedtest,userinfo" and so on)`, "FF0000")
                        ]});
                        return;
                    }

                    GuildSettingSchema.findOneAndUpdate({ GuildId: String(interaction.guildId) }, { DisabledCommands: updatedDisabledCommands }).then(async() => {
                        await client.CommandHandler.UpdateDisabledCommandCache(interaction.guildId);
                        await interaction.editReply("Successfully added the new disabled commands for this server.");
                    }).catch((err) => {
                        throw new Error(`An error occured when updated the settings database\n${err.stack}`);
                    })
                    return;
                }
                case "remove" : {
                    const targetCommands = ([]).concat(interaction.options.getString("commands").split(","));
                    var disabledCommands = guildSchema.DisabledCommands;
                    for (const targetCommand of targetCommands) {
                        if (disabledCommands[targetCommand]) {
                            delete(disabledCommands[targetCommand]);
                        }
                    }
                    GuildSettingSchema.findOneAndUpdate({ GuildId: String(interaction.guildId) }, { DisabledCommands: disabledCommands }).then(async() => {
                        await client.CommandHandler.UpdateDisabledCommandCache(interaction.guildId);
                        await interaction.editReply("Successfully removed the disabled commands for this server.");
                    }).catch((err) => {
                        throw new Error(`An error occured when updated the settings database\n${err.stack}`);
                    })
                    return;
                }
                case "list" : {
                    const embed = new MeteoriumEmbed("List of disabled commands", "Below are the commands that are disabled:\n(Note: disabled command categories override this setting!)")
                    for (const [name, desc] of Object.entries(guildSchema.DisabledCommands)) {
                        if (guildSchema.DisabledCommands.hasOwnProperty(name)) {
                            embed.addField(name, desc);
                        }
                    }
                    await interaction.editReply({ embeds: [embed] });
                    return;
                }
            }
        }
    }
}, new SlashCommandBuilder()
    .setName("settings")
    .setDescription("Command to change settings for this server")
    .addSubcommandGroup(new SlashCommandSubcommandGroupBuilder()
                            .setName("general")
                            .setDescription("General guild settings")
                            .addSubcommand(subcommand => subcommand.setName("enforcesayinexecutor")
                                    .setDescription("If true, sayin command will enforce telling the executor's name no matter what.")
                                    .addBooleanOption(option => option.setName("enabled").setDescription("Enabled or not").setRequired(true)))
                            .addSubcommand(subcommand => subcommand.setName("setmuterole")
                                    .setDescription("Mute role setting")
                                    .addRoleOption(option => option.setName("role").setDescription("The mute role").setRequired(true))))
    .addSubcommandGroup(new SlashCommandSubcommandGroupBuilder()
                            .setName("disabledcommands")
                            .setDescription("Setting for disabled commands for this server")
                            .addSubcommand(subcommand => subcommand.setName("add")
                                                            .setDescription("List of commands (seperated in commas ',' if multiple) that will be disabled.")
                                                            .addStringOption(option => option.setName("commands").setDescription("The command(s) (seperated in commas ',' if multiple)").setRequired(true)))
                            .addSubcommand(subcommand => subcommand.setName("remove")
                                                            .setDescription("List of commands (seperated in commas ',' if multiple) that will be enabled.")
                                                            .addStringOption(option => option.setName("commands").setDescription("The command(s) (seperated in commas ',' if multiple)").setRequired(true)))
                            .addSubcommand(subcommand => subcommand.setName("list")
                                                            .setDescription("Returns a list of commands that are disabled."))
    )
    
);