import { ChannelType, SlashCommandBuilder } from "discord.js";
import type { MeteoriumCommand } from "..";
import { MeteoriumEmbedBuilder } from "../../util/MeteoriumEmbedBuilder";

export const Command: MeteoriumCommand = {
    InteractionData: new SlashCommandBuilder()
        .setName("settings")
        .setDescription("Bot configuration utility command")
        .addSubcommandGroup((subcommandgroup) =>
            subcommandgroup
                .setName("generalmoderation")
                .setDescription("Moderation-related functionality configuration")
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName("enforcesayinexecutor")
                        .setDescription(
                            "If true, /sayin command will enforce telling the executor's name no matter what. (Admins are imnune)",
                        )
                        .addBooleanOption((option) =>
                            option.setName("enabled").setDescription("Enabled or not").setRequired(true),
                        ),
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName("logchannel")
                        .setDescription("The channel where command verbose logging will be sent at")
                        .addChannelOption((option) =>
                            option
                                .setName("channel")
                                .setDescription("The channel where verbose logging will be sent at")
                                .setRequired(true)
                                .addChannelTypes(ChannelType.GuildText),
                        ),
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName("publicmodlogchannel")
                        .setDescription(
                            "The channel where moderation logs will be sent at (instead of the current chat)",
                        )
                        .addChannelOption((option) =>
                            option
                                .setName("channel")
                                .setDescription("The channel where moderation logs will be sent at")
                                .setRequired(true)
                                .addChannelTypes(ChannelType.GuildText),
                        ),
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName("joinleavelogchannel")
                        .setDescription("The channel where join and leave logs will be sent at")
                        .addChannelOption((option) =>
                            option
                                .setName("channel")
                                .setDescription("The channel where moderation logs will be sent at")
                                .setRequired(true)
                                .addChannelTypes(ChannelType.GuildText),
                        ),
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName("banappeallink")
                        .setDescription(
                            "The ban appeals link, sent to people who got banned in dms if they can appeal.",
                        )
                        .addStringOption((option) =>
                            option
                                .setName("link")
                                .setDescription("The link for the ban appeal form. Don't specify to unset.")
                                .setRequired(false),
                        ),
                ),
        )
        .addSubcommandGroup((subcommandgroup) =>
            subcommandgroup
                .setName("disabledcommands")
                .setDescription("Configuration for disabled commands at this server")
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName("add")
                        .setDescription("List of commands (seperated in commas ',' if multiple) that will be disabled.")
                        .addStringOption((option) =>
                            option
                                .setName("commands")
                                .setDescription("The command(s) (seperated in commas ',' if multiple)")
                                .setRequired(true),
                        ),
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName("remove")
                        .setDescription("List of commands (seperated in commas ',' if multiple) that will be enabled.")
                        .addStringOption((option) =>
                            option
                                .setName("commands")
                                .setDescription("The command(s) (seperated in commas ',' if multiple)")
                                .setRequired(true),
                        ),
                )
                .addSubcommand((subcommand) =>
                    subcommand.setName("list").setDescription("Returns a list of commands that are disabled."),
                ),
        ),
    async Callback(interaction, client) {
        const settingsNS = client.Logging.GetNamespace("Commands/Settings");

        const Ephemeral = interaction.options.getBoolean("ephemeral", false) ? true : false;
        await interaction.deferReply({ ephemeral: Ephemeral });

        // Permission check
        if (!interaction.member.permissions.has("Administrator", true)) {
            return await interaction.editReply({
                embeds: [
                    new MeteoriumEmbedBuilder(undefined, interaction.user)
                        .setTitle("Cannot configure the bot")
                        .setDescription("You do not have the administrator permissions to configure the bot.")
                        .setErrorColor(),
                ],
            });
        }

        // Getting the schema for this guild from the database
        const GuildSchema = await client.Database.guild.findUnique({
            where: { GuildId: interaction.guildId },
        });
        if (!GuildSchema)
            return await interaction.editReply({
                content: "Guild does not have schematic?",
            });

        // Subcommand switch
        const SubcommandGroup = interaction.options.getSubcommandGroup(true);
        const Subcommand = interaction.options.getSubcommand(true);

        switch (SubcommandGroup) {
            case "generalmoderation": {
                switch (Subcommand) {
                    case "enforcesayinexecutor": {
                        const Enabled = interaction.options.getBoolean("enabled", true);
                        client.Database.guild
                            .update({
                                where: { GuildId: GuildSchema.GuildId },
                                data: { EnforceSayInExecutor: Enabled },
                            })
                            .then(async () => {
                                return await interaction.editReply({
                                    content: `Successfully configured \`\`EnforceSayinExecutor\`\` setting (new value is ${Enabled})`,
                                });
                            })
                            .catch(async (err) => {
                                settingsNS.error(`Error while update guild configuration:\n${err}`);
                                return await interaction.editReply({
                                    content:
                                        "An error occured while updating the guild configuration. Please try again later.",
                                });
                            });
                        break;
                    }
                    case "logchannel": {
                        const Channel = interaction.options.getChannel("channel", true);
                        if (!Channel.isTextBased())
                            return await interaction.editReply({
                                content: "The channel has to be a text-based channel!",
                            });
                        client.Database.guild
                            .update({
                                where: { GuildId: GuildSchema.GuildId },
                                data: { LoggingChannelId: Channel.id },
                            })
                            .then(async () => {
                                return await interaction.editReply({
                                    content: `Successfully configured \`\`logchannel\`\` setting (new value is ${Channel.id})`,
                                });
                            })
                            .catch(async (err) => {
                                settingsNS.error(`Error while update guild configuration:\n${err}`);
                                return await interaction.editReply({
                                    content:
                                        "An error occured while updating the guild configuration. Please try again later.",
                                });
                            });
                        break;
                    }
                    case "publicmodlogchannel": {
                        const Channel = interaction.options.getChannel("channel", true);
                        if (!Channel.isTextBased())
                            return await interaction.editReply({
                                content: "The channel has to be a text-based channel!",
                            });
                        client.Database.guild
                            .update({
                                where: { GuildId: GuildSchema.GuildId },
                                data: { PublicModLogChannelId: Channel.id },
                            })
                            .then(async () => {
                                return await interaction.editReply({
                                    content: `Successfully configured \`\`publicmodlogchannel\`\` setting (new value is ${Channel.id})`,
                                });
                            })
                            .catch(async (err) => {
                                settingsNS.error(`Error while update guild configuration:\n${err}`);
                                return await interaction.editReply({
                                    content:
                                        "An error occured while updating the guild configuration. Please try again later.",
                                });
                            });
                        break;
                    }
                    case "joinleavelogchannel": {
                        const Channel = interaction.options.getChannel("channel", true);
                        if (!Channel.isTextBased())
                            return await interaction.editReply({
                                content: "The channel has to be a text-based channel!",
                            });
                        client.Database.guild
                            .update({
                                where: { GuildId: GuildSchema.GuildId },
                                data: { JoinLeaveLogChannelId: Channel.id },
                            })
                            .then(async () => {
                                return await interaction.editReply({
                                    content: `Successfully configured \`\`joinleavelogchannel\`\` setting (new value is ${Channel.id})`,
                                });
                            })
                            .catch(async (err) => {
                                settingsNS.error(`Error while update guild configuration:\n${err}`);
                                return await interaction.editReply({
                                    content:
                                        "An error occured while updating the guild configuration. Please try again later.",
                                });
                            });
                        break;
                    }
                    case "banappeallink": {
                        const Link = interaction.options.getString("link", false) || "";
                        client.Database.guild
                            .update({
                                where: { GuildId: GuildSchema.GuildId },
                                data: { BanAppealLink: Link },
                            })
                            .then(async () => {
                                return await interaction.editReply({
                                    content: `Successfully configured \`\`banappeallink\`\` setting (new value is ${Link})`,
                                });
                            })
                            .catch(async (err) => {
                                settingsNS.error(`Error while update guild configuration:\n${err}`);
                                return await interaction.editReply({
                                    content:
                                        "An error occured while updating the guild configuration. Please try again later.",
                                });
                            });
                        break;
                    }
                    default:
                        break;
                }
                break;
            }
            case "disabledcommands": {
                switch (Subcommand) {
                    case "add": {
                        const TargetDisabledCommands = interaction.options.getString("commands", true).split(",");
                        const UpdatedDisabledCommands = GuildSchema.DisabledCommands.concat(TargetDisabledCommands);

                        // Check if command names are valid
                        let InvalidCommands = [];
                        for (const Command of TargetDisabledCommands)
                            if (!client.Commands.get(Command)) InvalidCommands.push(Command);
                        if (InvalidCommands.length !== 0)
                            return await interaction.editReply({
                                embeds: [
                                    new MeteoriumEmbedBuilder(undefined, interaction.user)
                                        .setTitle("Invalid command(s)")
                                        .setDescription(
                                            `The following commands do not exist:\`\`\`\n${InvalidCommands.join(
                                                ", ",
                                            )}\n\`\`\`\nEnsure you type command names correctly and are seperated using "," (like,this,for,example).`,
                                        ),
                                ],
                            });

                        // Update in database
                        client.Database.guild
                            .update({
                                where: { GuildId: GuildSchema.GuildId },
                                data: {
                                    DisabledCommands: UpdatedDisabledCommands,
                                },
                            })
                            .then(async () => {
                                return await interaction.editReply({
                                    content: `Successfully added the new disabled commands.`,
                                });
                            })
                            .catch(async (err) => {
                                settingsNS.error(`Error while update guild configuration:\n${err}`);
                                return await interaction.editReply({
                                    content:
                                        "An error occured while updating the guild configuration. Please try again later.",
                                });
                            });
                        break;
                    }
                    case "remove": {
                        const TargetRemoveDisabledCommands = interaction.options.getString("commands", true).split(",");
                        const UpdatedDisabledCommands = GuildSchema.DisabledCommands;

                        // Remove the commands that the user wants to remove
                        UpdatedDisabledCommands.filter((item) => {
                            return TargetRemoveDisabledCommands.indexOf(item) === -1;
                        });

                        // Update in database
                        client.Database.guild
                            .update({
                                where: { GuildId: GuildSchema.GuildId },
                                data: {
                                    DisabledCommands: UpdatedDisabledCommands,
                                },
                            })
                            .then(async () => {
                                return await interaction.editReply({
                                    content: `Successfully removed the disabled commands.`,
                                });
                            })
                            .catch(async (err) => {
                                settingsNS.error(`Error while update guild configuration:\n${err}`);
                                return await interaction.editReply({
                                    content:
                                        "An error occured while updating the guild configuration. Please try again later.",
                                });
                            });
                        break;
                    }
                    case "list": {
                        return await interaction.editReply({
                            embeds: [
                                new MeteoriumEmbedBuilder(undefined, interaction.user)
                                    .setTitle("List of disabled commands")
                                    .setDescription(`\`\`\`\n${GuildSchema.DisabledCommands.join(", ")}\n\`\`\``),
                            ],
                        });
                    }
                }
                break;
            }
        }
        return;
    },
};
