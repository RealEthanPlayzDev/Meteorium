import { SlashCommandBuilder } from 'discord.js';
import type { MeteoriumCommand } from "..";
import { MeteoriumEmbedBuilder } from '../../util/MeteoriumEmbedBuilder';

export const Command: MeteoriumCommand = {
    InteractionData: new SlashCommandBuilder()
        .setName("settings")
        .setDescription("Bot configuration utility command")
        .addSubcommandGroup(subcommandgroup => subcommandgroup.setName("generalmoderation")
                                                              .setDescription("Moderation-related functionality configuration")
                                                              .addSubcommand(subcommand => subcommand.setName("enforcesayinexecutor")
                                                                                                     .setDescription("If true, /sayin command will enforce telling the executor's name no matter what. (Admins are imnune)")
                                                                                                     .addBooleanOption(option => option.setName("enabled").setDescription("Enabled or not").setRequired(true))
                                                                            )
                                                              .addSubcommand(subcommand => subcommand.setName("muterole")
                                                                                                     .setDescription("The role to give when running /mute")
                                                                                                     .addRoleOption(option => option.setName("role").setDescription("The muted user role").setRequired(true))
                                                   )
                            )
        .addSubcommandGroup(subcommandgroup => subcommandgroup.setName("disabledcommands")
                                                              .setDescription("Configuration for disabled commands at this server")
                                                              .addSubcommand(subcommand => subcommand.setName("add")
                                                                                                     .setDescription("List of commands (seperated in commas ',' if multiple) that will be disabled.")
                                                                                                     .addStringOption(option => option.setName("commands").setDescription("The command(s) (seperated in commas ',' if multiple)").setRequired(true)))
                                                              .addSubcommand(subcommand => subcommand.setName("remove")
                                                                                                     .setDescription("List of commands (seperated in commas ',' if multiple) that will be enabled.")
                                                                                                     .addStringOption(option => option.setName("commands").setDescription("The command(s) (seperated in commas ',' if multiple)").setRequired(true)))
                                                              .addSubcommand(subcommand => subcommand.setName("list").setDescription("Returns a list of commands that are disabled."))
                            ),
    async Callback(interaction, client) {
        const Ephemeral = interaction.options.getBoolean("ephemeral", false) ? true : false;
        await interaction.deferReply({ ephemeral: Ephemeral });

        // Permission check
        if (!interaction.member.permissions.has("Administrator", true)) {
            return await interaction.editReply({
                embeds: [
                    new MeteoriumEmbedBuilder(undefined, interaction.user)
                        .setTitle("Cannot configure the bot")
                        .setDescription("You do not have the administrator permissions to configure the bot.")
                        .SetErrorColor()
                ]
            });
        }

        // Getting the schema for this guild from the database
        const GuildSchema = await client.Database.Guilds.findOne({ GuildId: interaction.guildId });
        if(!GuildSchema) return await interaction.editReply({ content: "Guild does not have schematic?" })

        // Subcommand switch
        const SubcommandGroup = interaction.options.getSubcommandGroup(true);
        const Subcommand = interaction.options.getSubcommand(true);

        switch(SubcommandGroup) {
            case("generalmoderation"): {
                switch(Subcommand) {
                    case("enforcesayinexecutor"): {
                        const Enabled = interaction.options.getBoolean("enabled", true);
                        client.Database.Guilds.updateOne({ GuildId: interaction.guildId }, { EnforceSayinExecutor: Enabled }).then(async() => {
                            return await interaction.editReply({ content: `Successfully configured the \`\`EnforceSayinExecutor\`\` setting (new value is ${Enabled})` });
                        }).catch(async(err) => {
                            console.error(`Error while update guild configuration:\n${err}`);
                            return await interaction.editReply({ content: "An error occured while updating the guild configuration. Please try again later." });
                        });
                        break;
                    }
                    case("muterole"): {
                        const Role = interaction.options.getRole("role", true);
                        client.Database.Guilds.updateOne({ GuildId: interaction.guildId }, { MuteRoleId: Role.id }).then(async() => {
                            return await interaction.editReply({ content: `Successfully configured the \`\`MuteRoleId\`\` setting (new value is ${Role.id})` });
                        }).catch(async(err) => {
                            console.error(`Error while update guild configuration:\n${err}`);
                            return await interaction.editReply({ content: "An error occured while updating the guild configuration. Please try again later." });
                        });
                        break;
                    }
                }
                break;
            }
            case("disabledcommands"): {
                const GuildSetting = await client.Database.Guilds.findOne({ GuildId: interaction.guildId });
                if (!GuildSetting) return;
                switch(Subcommand) {
                    case("add"): {
                        const TargetDisabledCommands = interaction.options.getString("commands", true).split(",")
                        const UpdatedDisabledCommands = GuildSetting.DisabledCommands.concat(TargetDisabledCommands);
                        
                        // Check if command names are valid
                        let InvalidCommands = []
                        for (const Command of TargetDisabledCommands) if (!client.Commands.get(Command)) InvalidCommands.push(Command);
                        if (InvalidCommands.length !== 0) return await interaction.editReply({
                            embeds: [
                                new MeteoriumEmbedBuilder(undefined, interaction.user)
                                    .setTitle("Invalid command(s)")
                                    .setDescription(`The following commands do not exist:\`\`\`\n${InvalidCommands.join(", ")}\n\`\`\`\nEnsure you type command names correctly and are seperated using "," (like,this,for,example).`)
                            ]
                        });

                        // Update in database
                        client.Database.Guilds.updateOne({ GuildId: interaction.guildId }, { DisabledCommands: UpdatedDisabledCommands }).then(async() => {
                            return await interaction.editReply({ content: `Successfully added the new disabled commands.` });
                        }).catch(async(err) => {
                            console.error(`Error while update guild configuration:\n${err}`);
                            return await interaction.editReply({ content: "An error occured while updating the guild configuration. Please try again later." });
                        });
                        break;
                    }
                    case("remove"): {
                        const TargetRemoveDisabledCommands = interaction.options.getString("commands", true).split(",");
                        const UpdatedDisabledCommands = GuildSetting.DisabledCommands

                        // Remove the commands that the user wants to remove
                        UpdatedDisabledCommands.filter(item => { return TargetRemoveDisabledCommands.indexOf(item) === -1 });

                        // Update in database
                        client.Database.Guilds.updateOne({ GuildId: interaction.guildId }, { DisabledCommands: UpdatedDisabledCommands }).then(async() => {
                            return await interaction.editReply({ content: `Successfully removed the disabled commands.` });
                        }).catch(async(err) => {
                            console.error(`Error while update guild configuration:\n${err}`);
                            return await interaction.editReply({ content: "An error occured while updating the guild configuration. Please try again later." });
                        });
                        break;
                    }
                    case("list"): {
                        return await interaction.editReply({
                            embeds: [
                                new MeteoriumEmbedBuilder(undefined, interaction.user)
                                    .setTitle("List of disabled commands")
                                    .setDescription(`\`\`\`\n${GuildSetting.DisabledCommands.join(", ")}\n\`\`\``)
                            ]
                        });
                    }
                }
                break;
            }
        }
        return;
    }
}