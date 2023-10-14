import { SlashCommandBuilder } from "discord.js";
import type { MeteoriumCommand } from "..";

export const Command: MeteoriumCommand = {
    InteractionData: new SlashCommandBuilder()
        .setName("reactto")
        .setDescription("Reacts to a message")
        .addStringOption((option) =>
            option
                .setName("messageid")
                .setDescription("The message where the bot will react to (message id)")
                .setRequired(true),
        )
        .addStringOption((option) =>
            option
                .setName("emoji")
                .setDescription(
                    "The emoji to be used on reacting to the message (supports both emoji id and normal emoji name)",
                )
                .setRequired(true),
        )
        .addBooleanOption((option) =>
            option.setName("ephemeral").setDescription("If true, any interaction feedbacks will be only shown to you"),
        )
        .addChannelOption((option) =>
            option
                .setName("channel")
                .setDescription("The text/thread channel where the message you want to react to is located"),
        ),
    async Callback(interaction, client) {
        const reactToNS = client.Logging.GetNamespace("Commands/ReactTo");

        const Ephemeral = interaction.options.getBoolean("ephemeral", false) ? true : false;
        await interaction.deferReply({ ephemeral: Ephemeral });

        const Channel = interaction.options.getChannel("channel", false)
            ? interaction.options.getChannel("channel", false)
            : interaction.channel;
        const MessageId = interaction.options.getString("messageid", true);
        const Emoji = interaction.options.getString("emoji", true);

        if (!interaction.member.permissions.has("ManageMessages"))
            return await interaction.editReply({
                content: "You do not have permission to use this command. (Missing ManageMessages permission)",
            });
        if (!Channel)
            return await interaction.editReply({
                content: "No channel? Please try again later",
            });
        if (!Channel.isTextBased())
            return await interaction.editReply({
                content: "Please provide a text-based channel!",
            });

        let TargetMessage, TargetEmoji;
        try {
            TargetMessage = await Channel.messages.fetch(MessageId);
        } catch (e) {
            reactToNS.error(`Error while getting message: ${e}`);
        }
        try {
            if (interaction.guild.emojis.cache.get(Emoji)) {
                TargetEmoji = interaction.guild.emojis.cache.get(Emoji);
            } else if (interaction.guild.emojis.cache.find((emoji) => Emoji === emoji.name)) {
                TargetEmoji = interaction.guild.emojis.cache.find((emoji) => Emoji === emoji.name);
            } else {
                TargetEmoji = undefined;
            }
        } catch (e) {
            reactToNS.error(`Error while getting emoji: ${e}`);
        }

        if (!TargetMessage)
            return await interaction.editReply({
                content: `Cannot find message "${MessageId}" in channel <#${Channel.id}> (${Channel.id})`,
            });
        if (!TargetEmoji)
            return await interaction.editReply({
                content: "Cannot find emoji in cache",
            });

        await TargetMessage.react(TargetEmoji);
        return await interaction.editReply({
            content: "Successfully reacted to message",
        });
    },
};
