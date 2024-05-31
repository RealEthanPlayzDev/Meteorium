import { PermissionFlagsBits, SlashCommandBuilder, channelMention, codeBlock } from "discord.js";
import MeteoriumEmbedBuilder from "../../../classes/embedBuilder.js";
import type { MeteoriumChatCommand } from "../../index.js";
import type { Guild } from "@prisma/client";

enum SettingType {
    Boolean,
    String,
    Channel,
}

// A mapping of guild settings between interaction and database
type DbSettingNames =
    | "EnforceSayInExecutor"
    | "JoinLeaveLogChannelId"
    | "PublicModLogChannelId"
    | "LoggingChannelId"
    | "BanAppealLink"
    | "EnabledGuildFeatures";
type SettingData = { type: SettingType; inName: string; dbName: DbSettingNames; description: string };
const settingsMapping: Array<SettingData> = [
    {
        type: SettingType.Boolean,
        inName: "enforcesayinexec",
        dbName: "EnforceSayInExecutor",
        description: "Executor name is required unless admin",
    },
    {
        type: SettingType.Channel,
        inName: "joinleavelogchn",
        dbName: "JoinLeaveLogChannelId",
        description: "A channel for announcing joins and leaves",
    },
    {
        type: SettingType.Channel,
        inName: "publogchn",
        dbName: "PublicModLogChannelId",
        description: "A channel for announcing moderation actions",
    },
    {
        type: SettingType.Channel,
        inName: "intlogchn",
        dbName: "LoggingChannelId",
        description: "A channel for reporting internal actions made by a user using the bot",
    },
    {
        type: SettingType.String,
        inName: "banappeallink",
        dbName: "BanAppealLink",
        description: "Ban appeals link, this link will be sent when someone gets banned",
    },
];

const interactionData = new SlashCommandBuilder()
    .setName("settings")
    .setDescription("Configure this server's features")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false);

// Automatically register settings
for (const setting of settingsMapping)
    interactionData.addSubcommand((option) => {
        option.setName(setting.inName);
        option.setDescription(setting.description);

        switch (setting.type) {
            case SettingType.Boolean:
                option.addBooleanOption((option) =>
                    option.setName("value").setDescription("Is this setting enabled?").setRequired(false),
                );
                break;
            case SettingType.String:
                option.addStringOption((option) =>
                    option.setName("value").setDescription("The string value").setRequired(false),
                );
                break;
            case SettingType.Channel:
                option.addChannelOption((option) =>
                    option.setName("value").setDescription("The channel value").setRequired(false),
                );
                break;
            default:
                throw new Error("invalid setting type");
        }

        return option;
    });

export const Command: MeteoriumChatCommand = {
    interactionData: interactionData,
    async callback(interaction, client) {
        // Find setting mapping
        const subcommand = interaction.options.getSubcommand(true);
        let data: SettingData;
        for (const setting of settingsMapping) if (subcommand == setting.inName) data = setting;
        if (!data!) throw new Error(`unknown setting: ${subcommand}`);

        // Defer
        await interaction.deferReply();

        // Get guild settings
        const guildSettings = await client.db.guild.findUnique({ where: { GuildId: interaction.guildId } });
        if (!guildSettings) throw new Error("could not get settings from database");

        // Response embed
        const embed = new MeteoriumEmbedBuilder(interaction.user).setTitle(`Setting - ${data.inName} (${data.dbName})`);

        switch (data.type) {
            case SettingType.Boolean: {
                const oldValue = guildSettings[data.dbName];
                const newValue = interaction.options.getBoolean("value", false);
                if (newValue == null) {
                    embed.addFields([{ name: "Value", value: oldValue ? "Enabled" : "Disabled" }]);
                    return await interaction.editReply({ embeds: [embed] });
                }
                // @ts-ignore
                guildSettings[data.dbName] = newValue!;
                await client.db.guild.update({ where: { GuildId: interaction.guildId }, data: guildSettings });
                embed.addFields([
                    { name: "New value", value: newValue ? "Enabled" : "Disabled" },
                    { name: "Old value", value: oldValue ? "Enabled" : "Disabled" },
                ]);
                break;
            }
            case SettingType.String: {
                const oldValue = guildSettings[data.dbName];
                const newValue = interaction.options.getString("value", false);
                if (newValue == null) {
                    embed.addFields([{ name: "Value", value: codeBlock(oldValue.toString()) }]);
                    return await interaction.editReply({ embeds: [embed] });
                }
                // @ts-ignore
                guildSettings[data.dbName] = newValue!.toString();
                await client.db.guild.update({ where: { GuildId: interaction.guildId }, data: guildSettings });
                embed.addFields([
                    { name: "New value", value: codeBlock(newValue) },
                    { name: "Old value", value: codeBlock(oldValue.toString()) },
                ]);
                break;
            }
            case SettingType.Channel: {
                const oldValue = guildSettings[data.dbName];
                const newValue = interaction.options.getChannel("value", false);
                if (newValue == null) {
                    embed.addFields([{ name: "Value", value: channelMention(oldValue.toString()) }]);
                    return await interaction.editReply({ embeds: [embed] });
                }
                // @ts-ignore
                guildSettings[data.dbName] = newValue!.id.toString();
                await client.db.guild.update({ where: { GuildId: interaction.guildId }, data: guildSettings });
                embed.addFields([
                    { name: "New value", value: channelMention(newValue.id) },
                    { name: "Old value", value: channelMention(oldValue.toString()) },
                ]);
                break;
            }
            default:
                throw new Error("invalid setting type");
        }

        return await interaction.editReply({ embeds: [embed] });
    },
};
