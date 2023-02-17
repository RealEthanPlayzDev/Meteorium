import { SlashCommandBuilder } from 'discord.js';
import type { MeteoriumCommand } from "..";

export const Command: MeteoriumCommand = {
    InteractionData: new SlashCommandBuilder()
        .setName("sayin")
        .setDescription("Says a message in a channel")
        .addStringOption(option => option.setName("message").setDescription("The message to be sent").setRequired(true))
        .addChannelOption(option => option.setName("channel").setDescription("Optional channel where message will be sent (if not specified it will be sent to the current channel"))
        .addBooleanOption(option => option.setName("showexecutorname").setDescription("Show the executor name or not (can be overriden by EnforceSayinExecutor, doesn't include admins)"))
        .addBooleanOption(option => option.setName("ephemeral").setDescription("Shows the success message or not (if false then success message only shows to you)"))
        .addStringOption(option => option.setName("replyto").setDescription("Fill with the message id of the target message you want to reply to")),
    async Callback(interaction, client) {
        const Ephemeral = interaction.options.getBoolean("ephemeral", false) ? true : false;
        await interaction.deferReply({ ephemeral: Ephemeral });

        const GuildSetting = await client.Database.Guilds.findOne({ GuildId: String(interaction.guildId) });
        if (!GuildSetting) return await interaction.editReply({ content: "No guild setting inside database?" });

        const ShowExecutorName = GuildSetting.EnforceSayinExecutor && !interaction.member.permissions.has("Administrator", true)  ? true : (interaction.options.getBoolean("showexecutorname", false) ? true : false);
        const Message = (ShowExecutorName ? `${interaction.options.getString("message", true)}\n\n(Sayin command executed by ${interaction.user.tag} (${interaction.user.id}))` : interaction.options.getString("message", true));
        const Channel = interaction.options.getChannel("channel", false) ? interaction.options.getChannel("channel") : interaction.channel;
        const ReplyTarget = interaction.options.getString("replyto", false);

        if (!ShowExecutorName && interaction.member.permissions.has("Administrator")) return await interaction.editReply({ content: "You do not have permission to not show the executor's name. (Requires Administrator permission to be imnune)" });
        if (!Channel) return await interaction.editReply({ content: "No channel? Please try again later." });
        if (!Channel.isTextBased()) return await interaction.editReply({ content: "Please specify a text-based channel!" });
        
        await Channel.send({ content: Message, reply: ReplyTarget ? { messageReference: ReplyTarget } : undefined });
        return await interaction.editReply({ content: "Successfully sent message." });
    }
}