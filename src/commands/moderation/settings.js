const { SlashCommandBuilder, SlashCommandSubcommandGroupBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const MeteoriumCommand = require("../../util/Command");
const GuildSettingSchema = require("../../schemas/GuildSettingSchema");

module.exports = new MeteoriumCommand("settings", "Command to change settings for this server", async (interaction, client) => {
    await interaction.deferReply();
    if (interaction.options.getSubcommand() === "enforcesayinexecutor") {
         if (interaction.member.permissions.has("ADMINISTRATOR", true)) {
            GuildSettingSchema.findOneAndUpdate({ GuildId: String(interaction.guildId) }, { EnforceSayinExecutor: interaction.options.getBoolean("enabled") }).then(async () => {
                await interaction.editReply(`Successfully changed setting "EnforceSayinExecutor", new value: ${interaction.options.getBoolean("enabled")}`);
             }).catch((err) => {
                throw new Error(`An error occured when updated the settings database\n${err.stack}`);
             });
         } else {
             await interaction.editReply({ embeds: [
                 new MessageEmbed()
                    .setTitle("Cannot change this setting")
                    .setDescription("You do not have permission to change this setting! (Missing permission ADMINISTRATOR)")
                    .setColor("FF0000")
                    .setFooter("Meteorium | Developed by RadiatedExodus (RealEthanPlayzDev)")
                    .setTimestamp()
             ]});
         }
    } else if (interaction.options.getSubcommandGroup() === "disabledcommands") {
        if (interaction.member.permissions.has("ADMINISTRATOR", true)) {
            const guildSchema = await GuildSettingSchema.findOne({ GuildId: interaction.guildId });
            if (interaction.options.getSubcommand() === "add") {
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
                        new MessageEmbed()
                            .setTitle("Error")
                            .setDescription(`Command name ${failParseCommandName} does not exist! (to prevent this error, type command names correctly, multiple commands seperated with command like "test,embedtest,userinfo" and so on)`)
                            .setColor("FF0000")
                            .setFooter("Meteorium | Developed by RadiatedExodus (RealEthanPlayzDev)")
                            .setTimestamp()
                        ]});
                    return;
                }

                guildSchema.DisabledCommands = updatedDisabledCommands;
                guildSchema.markModified("DisabledCommands");
                guildSchema.save().then(async () => {
                    await client.CommandHandler.UpdateDisabledCommandCache(interaction.guildId);
                    await interaction.editReply("Successfully added the new disabled commands for this server.");
                }).catch((err) => {
                    throw new Error(`An error occured when updated the settings database\n${err.stack}`);
                });
            } else if (interaction.options.getSubcommand() === "remove") {
                const targetCommands = ([]).concat(interaction.options.getString("commands").split(","));
                var disabledCommands = guildSchema.DisabledCommands;
                for (const targetCommand of targetCommands) {
                    if (disabledCommands[targetCommand]) {
                        delete(disabledCommands[targetCommand]);
                    }
                }
                guildSchema.DisabledCommands = disabledCommands;
                guildSchema.markModified("DisabledCommands");
                guildSchema.save().then(async () => {
                    await client.CommandHandler.UpdateDisabledCommandCache(interaction.guildId);
                    await interaction.editReply("Successfully removed the disabled commands for this server.");
                }).catch((err) => {
                    throw new Error(`An error occured when updated the settings database\n${err.stack}`);
                });
            } else if (interaction.options.getSubcommand() === "list") {
                const embed = new MessageEmbed()
                                .setTitle("List of disabled commands")
                                .setDescription("Below are the commands that are disabled:\n(Note: disabled command categories override this setting!)")
                                .setColor("0099ff")
                                .setFooter("Meteorium | Developed by RadiatedExodus (RealEthanPlayzDev)")
                                .setTimestamp()
                for (const [name, desc] of Object.entries(guildSchema.DisabledCommands)) {
                    if (guildSchema.DisabledCommands.hasOwnProperty(name)) {
                        embed.addField(name, desc);
                    }
                }
                await interaction.editReply({ embeds: [embed] });
            }
        } else {
            await interaction.editReply({ embeds: [
                new MessageEmbed()
                   .setTitle("Cannot change this setting")
                   .setDescription("You do not have permission to change this setting! (Missing permission ADMINISTRATOR)")
                   .setColor("FF0000")
                   .setFooter("Meteorium | Developed by RadiatedExodus (RealEthanPlayzDev)")
                   .setTimestamp()
            ]});
        }
    }
}, new SlashCommandBuilder()
    .setName("settings")
    .setDescription("Command to change settings for this server")
    .addSubcommand(subcommand => subcommand.setName("enforcesayinexecutor")
                                    .setDescription("If true, sayin command will enforce telling the executor's name no matter what.")
                                    .addBooleanOption(option => option.setName("enabled").setDescription("Enabled or not").setRequired(true)))
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
    ));